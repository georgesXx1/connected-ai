import crypto from "crypto";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { findUserByUsername, users } from "./mock-data";
import { readServerPortalData } from "./server-store";
import type { PortalRole, PortalUser } from "./types";

const PORTAL_SESSION_COOKIE = "school_portal_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

function getSessionSecret() {
  return (
    process.env.PORTAL_SESSION_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    "school-portal-session-secret"
  );
}

function signPayload(payload: string) {
  return crypto
    .createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url");
}

function encodeSessionValue(userId: string) {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `${userId}.${expiresAt}`;
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
    const expiresAt = Number(payloadParts.at(-1));
    const userId = payloadParts.slice(0, -1).join(".");

    if (!userId || Number.isNaN(expiresAt) || Date.now() > expiresAt) {
      return null;
    }

    return { userId, expiresAt };
  } catch {
    return null;
  }
}

export function validatePortalCredentials(username: string, password: string) {
  const user = findUserByUsername(username);

  if (!user || user.password !== password) {
    return null;
  }

  return user;
}

export async function validatePortalCredentialsFromStore(username: string, password: string) {
  const data = await readServerPortalData();
  return data.users.find(
    (user) =>
      user.username.toLowerCase() === username.trim().toLowerCase() &&
      user.password === password,
  ) ?? validatePortalCredentials(username, password);
}

export async function getPortalSessionUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(PORTAL_SESSION_COOKIE)?.value;

  if (!sessionCookie) {
    return null;
  }

  const decoded = decodeSessionValue(sessionCookie);
  const data = await readServerPortalData();
  return data.users.find((user) => user.id === decoded?.userId) ??
    users.find((user) => user.id === decoded?.userId) ??
    null;
}

export async function requirePortalRole(role: PortalRole) {
  const user = await getPortalSessionUser();

  if (!user) {
    return { user: null, redirectTo: "/login" };
  }

  if (user.role !== role) {
    return { user, redirectTo: `/portal/${user.role}` };
  }

  return { user, redirectTo: null };
}

export function attachPortalSession(response: NextResponse, user: PortalUser) {
  response.cookies.set({
    name: PORTAL_SESSION_COOKIE,
    value: encodeSessionValue(user.id),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return response;
}

export function clearPortalSession(response: NextResponse) {
  response.cookies.set({
    name: PORTAL_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
