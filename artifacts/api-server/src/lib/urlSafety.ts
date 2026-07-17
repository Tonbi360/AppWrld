import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const MAX_REDIRECTS = 3;
const MAX_RESPONSE_BYTES = 1_000_000;

function isPrivateIpv4(address: string): boolean {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return true;
  }

  const [a, b] = octets;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 0 || b === 168)) ||
    (a === 198 && (b === 18 || b === 19 || b === 51)) ||
    (a === 203 && b === 0) ||
    a >= 224
  );
}

function isPrivateAddress(address: string): boolean {
  const version = isIP(address);
  if (version === 4) return isPrivateIpv4(address);
  if (version !== 6) return true;

  const value = address.toLowerCase();
  if (value === "::" || value === "::1" || value.startsWith("fc") || value.startsWith("fd") || value.startsWith("fe80:")) {
    return true;
  }

  const mappedIpv4 = value.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  return mappedIpv4 ? isPrivateIpv4(mappedIpv4) : false;
}

/** Validates a public HTTP(S) target before AppWorld fetches it. */
export async function assertSafePublicUrl(value: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Enter a valid URL.");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Only HTTP and HTTPS URLs can be checked.");
  }

  if (url.username || url.password) {
    throw new Error("URLs containing credentials are not allowed.");
  }

  const hostname = url.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
    throw new Error("Local network addresses cannot be checked.");
  }

  if (isIP(hostname)) {
    if (isPrivateAddress(hostname)) throw new Error("Private network addresses cannot be checked.");
    return url;
  }

  let records: Array<{ address: string }>;
  try {
    records = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new Error("The website address could not be resolved.");
  }

  if (!records.length || records.some((record) => isPrivateAddress(record.address))) {
    throw new Error("Private network addresses cannot be checked.");
  }

  return url;
}

function isRedirect(response: Response): boolean {
  return [301, 302, 303, 307, 308].includes(response.status);
}

/** Fetches a public target while checking every redirect destination. */
export async function fetchPublicUrl(value: string | URL, timeoutMs: number): Promise<Response> {
  let url = await assertSafePublicUrl(String(value));

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    const response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
      headers: { "User-Agent": "AppWorld-Manifest-Checker/1.0" },
    });

    if (!isRedirect(response)) return response;

    const location = response.headers.get("location");
    if (!location) throw new Error("The website returned an invalid redirect.");
    if (redirects === MAX_REDIRECTS) throw new Error("Too many redirects while checking this website.");

    url = await assertSafePublicUrl(new URL(location, url).toString());
  }

  throw new Error("Too many redirects while checking this website.");
}

export async function readResponseText(response: Response): Promise<string> {
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_RESPONSE_BYTES) {
    throw new Error("The website response is too large to check.");
  }

  if (!response.body) return "";

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      size += value.byteLength;
      if (size > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new Error("The website response is too large to check.");
      }
      chunks.push(value);
    }
  }

  return Buffer.concat(chunks).toString("utf8");
}

export function calculatePwaReadiness(manifest: Record<string, unknown>): number {
  let score = 0;

  if (typeof manifest.name === "string" || typeof manifest.short_name === "string") score += 15;
  if (typeof manifest.description === "string" && manifest.description.trim()) score += 5;
  if (typeof manifest.start_url === "string") score += 20;
  if (["standalone", "fullscreen", "minimal-ui"].includes(String(manifest.display))) score += 25;
  if (typeof manifest.theme_color === "string") score += 10;

  const icons = Array.isArray(manifest.icons) ? manifest.icons : [];
  const hasInstallIcon = icons.some((icon) => {
    if (!icon || typeof icon !== "object") return false;
    const sizes = String((icon as { sizes?: unknown }).sizes ?? "");
    return sizes.includes("192") || sizes.includes("512") || sizes === "any";
  });

  if (hasInstallIcon) score += 25;
  return score;
}
