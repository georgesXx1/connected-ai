import crypto from "crypto";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const ADMIN_SESSION_COOKIE = "gemai_admin_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || "gemai-admin-session-secret";
}

export function getAdminCredentials() {
  return {
    username: process.env.ADMIN_USERNAME || "admin",
    password: process.env.ADMIN_PASSWORD || "gemai-admin",
  };
}

function signPayload(payload: string) {
  return crypto
    .createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url");
}

function encodeSessionValue(username: string) {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `${username}.${expiresAt}`;
  const signature = signPayload(payload);
  return Buffer.from(`${payload}.${signature}`, "utf8").toString("base64url");
}

function decodeSessionValue(value: string) {
  try {
    const decoded = Buffer.from(value, "base64url").toString("utf8");
    const lastSeparator = decoded.lastIndexOf(".");

    if (lastSeparator === -1) {
      return null;
    }

    const payload = decoded.slice(0, lastSeparator);
    const providedSignature = decoded.slice(lastSeparator + 1);
    const expectedSignature = signPayload(payload);

    if (
      !crypto.timingSafeEqual(
        Buffer.from(providedSignature),
        Buffer.from(expectedSignature),
      )
    ) {
      return null;
    }

    const payloadParts = payload.split(".");

    if (payloadParts.length < 2) {
      return null;
    }

    const expiresAt = Number(payloadParts[payloadParts.length - 1]);
    const username = payloadParts.slice(0, -1).join(".");

    if (!username || Number.isNaN(expiresAt) || Date.now() > expiresAt) {
      return null;
    }

    return { username, expiresAt };
  } catch {
    return null;
  }
}

export async function getAdminSessionUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!sessionCookie) {
    return null;
  }

  const decoded = decodeSessionValue(sessionCookie);
  return decoded?.username ?? null;
}

export async function isAdminAuthenticated() {
  return (await getAdminSessionUser()) !== null;
}

export function attachAdminSession(response: NextResponse, username: string) {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: encodeSessionValue(username),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return response;
}

export function clearAdminSession(response: NextResponse) {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
