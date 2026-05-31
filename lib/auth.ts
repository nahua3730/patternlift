import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createId, db } from "@/lib/db";

const scrypt = promisify(scryptCallback);

export const SESSION_COOKIE_NAME = "patternlift_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30;

export type SessionUser = {
  id: string;
  email: string;
  displayName: string | null;
};

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [salt, savedHash] = storedHash.split(":");
  if (!salt || !savedHash) return false;

  const derived = (await scrypt(password, salt, 64)) as Buffer;
  const savedBuffer = Buffer.from(savedHash, "hex");
  if (savedBuffer.length !== derived.length) return false;
  return timingSafeEqual(savedBuffer, derived);
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function getCookieConfig(token: string) {
  return {
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000
  };
}

export function clearCookieConfig() {
  return {
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  };
}

export async function createUser({
  email,
  password,
  displayName
}: {
  email: string;
  password: string;
  displayName?: string;
}) {
  const normalizedEmail = normalizeEmail(email);
  const existing = db
    .prepare(`SELECT id FROM users WHERE email = ? LIMIT 1`)
    .get(normalizedEmail) as { id: string } | undefined;

  if (existing) {
    throw new Error("That email is already in use.");
  }

  const passwordHash = await hashPassword(password);
  const userId = createId("user");
  db.prepare(
    `
      INSERT INTO users (id, email, password_hash, display_name)
      VALUES (?, ?, ?, ?)
    `
  ).run(userId, normalizedEmail, passwordHash, displayName?.trim() || null);

  return {
    id: userId,
    email: normalizedEmail,
    displayName: displayName?.trim() || null
  } satisfies SessionUser;
}

export async function authenticateUser(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);
  const user = db
    .prepare(
      `
        SELECT id, email, password_hash, display_name
        FROM users
        WHERE email = ?
        LIMIT 1
      `
    )
    .get(normalizedEmail) as
    | {
        id: string;
        email: string;
        password_hash: string;
        display_name: string | null;
      }
    | undefined;

  if (!user) {
    throw new Error("We couldn't find an account with that email.");
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    throw new Error("That password didn't match.");
  }

  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name
  } satisfies SessionUser;
}

export function createSession(userId: string) {
  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

  db.prepare(
    `
      INSERT INTO sessions (id, user_id, expires_at)
      VALUES (?, ?, ?)
    `
  ).run(token, userId, expiresAt);

  return token;
}

export function deleteSession(token: string) {
  db.prepare(`DELETE FROM sessions WHERE id = ?`).run(token);
}

export async function getCurrentUser() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  db.prepare(`DELETE FROM sessions WHERE datetime(expires_at) <= datetime('now')`).run();

  const record = db
    .prepare(
      `
        SELECT users.id, users.email, users.display_name
        FROM sessions
        JOIN users ON users.id = sessions.user_id
        WHERE sessions.id = ?
          AND datetime(sessions.expires_at) > datetime('now')
        LIMIT 1
      `
    )
    .get(token) as
    | {
        id: string;
        email: string;
        display_name: string | null;
      }
    | undefined;

  if (!record) {
    return null;
  }

  return {
    id: record.id,
    email: record.email,
    displayName: record.display_name
  } satisfies SessionUser;
}

export async function requireUser(nextPath: string) {
  const user = await getCurrentUser();
  if (!user) {
    const params = new URLSearchParams();
    params.set("next", nextPath);
    redirect(`/login?${params.toString()}`);
  }

  return user;
}
