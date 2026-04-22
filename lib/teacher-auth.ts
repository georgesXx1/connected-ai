import crypto from "crypto";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const TEACHER_SESSION_COOKIE = "gemai_teacher_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

function getSessionSecret() {
  return process.env.TEACHER_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || "gemai-teacher-session-secret";
}

function signPayload(payload: string) {
  return crypto
    .createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url");
}

function encodeSessionValue(teacherId: string) {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `${teacherId}.${expiresAt}`;
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
    const teacherId = payloadParts.slice(0, -1).join(".");

    if (!teacherId || Number.isNaN(expiresAt) || Date.now() > expiresAt) {
      return null;
    }

    return { teacherId, expiresAt };
  } catch {
    return null;
  }
}

export async function getTeacherSessionId() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(TEACHER_SESSION_COOKIE)?.value;

  if (!sessionCookie) {
    return null;
  }

  return decodeSessionValue(sessionCookie)?.teacherId ?? null;
}

export function attachTeacherSession(response: NextResponse, teacherId: string) {
  response.cookies.set({
    name: TEACHER_SESSION_COOKIE,
    value: encodeSessionValue(teacherId),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return response;
}

export function clearTeacherSession(response: NextResponse) {
  response.cookies.set({
    name: TEACHER_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
