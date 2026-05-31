import { NextResponse } from "next/server";

import { attachPortalSession, validatePortalCredentialsFromStore } from "@/lib/portal/auth";
import {
  ensureProfileForUser,
  mergeServerPortalData,
  readServerPortalData,
  writeServerPortalData,
  type ServerPortalData,
} from "@/lib/portal/server-store";
import type { PortalRole, PortalUser } from "@/lib/portal/types";
import { roleHomePaths } from "@/lib/portal/utils";

const portalRoles: PortalRole[] = ["student", "parent", "teacher", "admin", "psychologist"];

function isPortalRole(value: unknown): value is PortalRole {
  return typeof value === "string" && portalRoles.includes(value as PortalRole);
}

function sanitizeClientUser(value: unknown): PortalUser | null {
  const item = value && typeof value === "object" ? (value as Partial<PortalUser>) : null;

  if (
    !item ||
    typeof item.id !== "string" ||
    typeof item.username !== "string" ||
    typeof item.password !== "string" ||
    !isPortalRole(item.role) ||
    typeof item.displayName !== "string" ||
    typeof item.avatarInitials !== "string"
  ) {
    return null;
  }

  return {
    id: item.id,
    username: item.username,
    password: item.password,
    role: item.role,
    displayName: item.displayName,
    avatarInitials: item.avatarInitials,
  };
}

function validateClientCredentials(
  clientData: unknown,
  username: string,
  password: string,
) {
  const clientUsers = clientData && typeof clientData === "object"
    ? (clientData as Partial<ServerPortalData>).users
    : clientData;
  const safeUsers = Array.isArray(clientUsers)
    ? clientUsers.map(sanitizeClientUser).filter((user): user is PortalUser => Boolean(user))
    : [];

  const user = safeUsers.find(
    (entry) =>
      entry.username.toLowerCase() === username.trim().toLowerCase() &&
      entry.password === password,
  );

  return user ?? null;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { username?: string; password?: string; clientData?: unknown; clientUsers?: unknown }
    | null;

  const username = body?.username ?? "";
  const password = body?.password ?? "";

  const clientData = body?.clientData && typeof body.clientData === "object" && Array.isArray((body.clientData as Partial<ServerPortalData>).users)
    ? (body.clientData as ServerPortalData)
    : null;
  const clientUser = validateClientCredentials(body?.clientData ?? body?.clientUsers, username, password);
  let serverData = await readServerPortalData();

  if (clientData) {
    serverData = mergeServerPortalData(serverData, clientData);
    await writeServerPortalData(serverData);
  } else if (clientUser && !serverData.users.some((entry) => entry.id === clientUser.id)) {
    serverData.users.push(clientUser);
    ensureProfileForUser(serverData, clientUser);
    await writeServerPortalData(serverData);
  }

  const user =
    serverData.users.find(
      (entry) =>
        entry.username.toLowerCase() === username.trim().toLowerCase() &&
        entry.password === password,
    ) ??
    clientUser ??
    await validatePortalCredentialsFromStore(username, password);

  if (!user) {
    return NextResponse.json(
      { message: "Invalid username or password." },
      { status: 401 },
    );
  }

  const latestData = await readServerPortalData();
  if (!latestData.users.some((entry) => entry.id === user.id)) {
    latestData.users.push(user);
  }
  const latestUser = latestData.users.find((entry) => entry.id === user.id) ?? user;
  ensureProfileForUser(latestData, latestUser);
  await writeServerPortalData(latestData);

  const response = NextResponse.json({
    user: {
      id: latestUser.id,
      username: latestUser.username,
      role: latestUser.role,
      displayName: latestUser.displayName,
    },
    redirectTo: roleHomePaths[latestUser.role],
  });

  return attachPortalSession(response, latestUser);
}
