import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createSession, setSessionCookie, SESSION_TTL } from "../lib/auth";
import type { SessionData } from "../lib/auth";

const router = Router();

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(e: string) { return EMAIL_RE.test(e); }

router.post("/auth/email/register", async (req, res) => {
  const { email, password, firstName, lastName } = req.body as Record<string, unknown>;

  if (
    typeof email !== "string" || !isValidEmail(email) ||
    typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH
  ) {
    res.status(400).json({
      error: `Valid email and a password of at least ${MIN_PASSWORD_LENGTH} characters are required.`,
    });
    return;
  }

  const normalised = email.toLowerCase().trim();

  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, normalised));

  if (existing) {
    res.status(409).json({ error: "An account with that email already exists." });
    return;
  }

  const hash = await bcrypt.hash(password, 12);

  const [user] = await db
    .insert(usersTable)
    .values({
      email: normalised,
      firstName: typeof firstName === "string" ? firstName.trim() || null : null,
      lastName: typeof lastName === "string" ? lastName.trim() || null : null,
      passwordHash: hash,
      authProvider: "email",
    })
    .returning();

  const sessionData: SessionData = {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
      role: user.role,
    },
    access_token: "",
  };

  const sid = await createSession(sessionData);
  setSessionCookie(res, sid);
  res.status(201).json({ success: true });
});

router.post("/auth/email/login", async (req, res) => {
  const { email, password } = req.body as Record<string, unknown>;

  if (typeof email !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  const normalised = email.toLowerCase().trim();

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, normalised));

  if (!user || !user.passwordHash) {
    await bcrypt.compare("dummy", "$2b$12$dummyhashtopreventtimingattack");
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  const sessionData: SessionData = {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
      role: user.role,
    },
    access_token: "",
  };

  const sid = await createSession(sessionData);
  setSessionCookie(res, sid);
  res.json({ success: true });
});

export default router;
