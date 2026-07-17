import { Request, Response, NextFunction } from "express";

type Key = string;

function nowMs() { return Date.now(); }

export function createRateLimiter({ windowMs, max }: { windowMs: number; max: number }) {
  const hits = new Map<Key, number[]>();

  return function rateLimiter(req: Request, res: Response, next: NextFunction) {
    try {
      const key = (req.ip ?? req.headers["x-forwarded-for"] ?? "unknown") as string;
      const bucket = hits.get(key) ?? [];
      const cutoff = nowMs() - windowMs;
      // keep only recent timestamps
      const recent = bucket.filter((t) => t > cutoff);
      recent.push(nowMs());
      hits.set(key, recent);
      if (recent.length > max) {
        res.status(429).json({ error: "Too many requests" });
        return;
      }
    } catch (err) {
      // fail open on error
    }
    next();
  };
}
