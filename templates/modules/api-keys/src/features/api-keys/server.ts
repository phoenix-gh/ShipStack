import { and, desc, eq, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { env } from "cloudflare:workers";

import { apiKey } from "~/db/api-keys-schema";
import { auth } from "~/features/auth/server";

import * as apiKeysSchema from "~/db/api-keys-schema";

const db = drizzle(env.DB, { schema: apiKeysSchema });
const keyPrefix = "ss";

export interface ApiKeySummary {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export interface RequestIdentity {
  authenticated: boolean;
  authType: "session" | "api_key" | null;
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
  } | null;
  apiKey: {
    id: string;
    name: string;
    keyPrefix: string;
  } | null;
}

export async function listApiKeys(headers: Headers) {
  const session = await requireSession(headers);
  const keys = await db
    .select()
    .from(apiKey)
    .where(eq(apiKey.userId, session.user.id))
    .orderBy(desc(apiKey.createdAt));

  return keys.map(toSummary);
}

export async function createApiKey(headers: Headers, request: Request) {
  const session = await requireSession(headers);
  const input = await readCreateInput(request);
  const plaintextKey = createPlaintextKey();
  const prefix = plaintextKey.slice(0, 12);
  const now = new Date();
  const record = {
    id: crypto.randomUUID(),
    userId: session.user.id,
    name: input.name,
    keyPrefix: prefix,
    keyHash: await sha256(plaintextKey),
    expiresAt: input.expiresAt,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(apiKey).values(record);

  return {
    key: plaintextKey,
    apiKey: toSummary({
      ...record,
      lastUsedAt: null,
      revokedAt: null,
    }),
  };
}

export async function revokeApiKey(headers: Headers, keyId: string | null) {
  const session = await requireSession(headers);

  if (!keyId) {
    throw new ApiKeysError("missing_key_id", "API key id is required.", 400);
  }

  const [existing] = await db
    .select()
    .from(apiKey)
    .where(and(eq(apiKey.id, keyId), eq(apiKey.userId, session.user.id)))
    .limit(1);

  if (!existing) {
    throw new ApiKeysError("not_found", "API key was not found.", 404);
  }

  const revokedAt = new Date();
  await db
    .update(apiKey)
    .set({ revokedAt, updatedAt: revokedAt })
    .where(eq(apiKey.id, existing.id));

  return { id: existing.id, revoked: true };
}

export async function identifyRequest(
  headers: Headers,
): Promise<RequestIdentity> {
  const session = await auth.api.getSession({ headers });

  if (session?.user?.id) {
    return {
      authenticated: true,
      authType: "session",
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
      apiKey: null,
    };
  }

  const key = getBearerToken(headers) ?? headers.get("x-api-key");
  if (!key) {
    return anonymousIdentity();
  }

  const identity = await authenticateApiKey(key);
  return identity ?? anonymousIdentity();
}

export async function requireRequestIdentity(headers: Headers) {
  const identity = await identifyRequest(headers);

  if (!identity.authenticated || !identity.user) {
    throw new ApiKeysError("unauthorized", "Authentication is required.", 401);
  }

  return identity;
}

export class ApiKeysError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

async function requireSession(headers: Headers) {
  const session = await auth.api.getSession({ headers });

  if (!session?.user?.id) {
    throw new ApiKeysError("unauthorized", "Authentication is required.", 401);
  }

  return session;
}

async function authenticateApiKey(
  plaintextKey: string,
): Promise<RequestIdentity | null> {
  const hash = await sha256(plaintextKey);
  const [record] = await db
    .select()
    .from(apiKey)
    .where(and(eq(apiKey.keyHash, hash), isNull(apiKey.revokedAt)))
    .limit(1);

  if (!record) {
    return null;
  }

  if (record.expiresAt && record.expiresAt.getTime() <= Date.now()) {
    return null;
  }

  const lastUsedAt = new Date();
  await db
    .update(apiKey)
    .set({ lastUsedAt, updatedAt: lastUsedAt })
    .where(eq(apiKey.id, record.id));

  return {
    authenticated: true,
    authType: "api_key",
    user: {
      id: record.userId,
    },
    apiKey: {
      id: record.id,
      name: record.name,
      keyPrefix: record.keyPrefix,
    },
  };
}

async function readCreateInput(request: Request) {
  const body = await readJson(request);
  const name = sanitizeName(
    typeof body.name === "string" ? body.name : "Default API key",
  );
  const expiresAt =
    typeof body.expiresAt === "string" && body.expiresAt
      ? new Date(body.expiresAt)
      : null;

  if (expiresAt && Number.isNaN(expiresAt.getTime())) {
    throw new ApiKeysError(
      "invalid_expires_at",
      "expiresAt must be an ISO date string.",
      400,
    );
  }

  return { name, expiresAt };
}

async function readJson(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return {};
  }

  try {
    const value = await request.json();
    return isRecord(value) ? value : {};
  } catch {
    throw new ApiKeysError("invalid_json", "Request body must be JSON.", 400);
  }
}

function createPlaintextKey() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const token = Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return `${keyPrefix}_${token}`;
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function getBearerToken(headers: Headers) {
  const authorization = headers.get("authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

function sanitizeName(name: string) {
  const cleanName = name.trim().replace(/\s+/g, " ").slice(0, 80);
  return cleanName || "Default API key";
}

function anonymousIdentity(): RequestIdentity {
  return {
    authenticated: false,
    authType: null,
    user: null,
    apiKey: null,
  };
}

function toSummary(key: {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
}): ApiKeySummary {
  return {
    id: key.id,
    name: key.name,
    keyPrefix: key.keyPrefix,
    lastUsedAt: key.lastUsedAt?.toISOString() ?? null,
    expiresAt: key.expiresAt?.toISOString() ?? null,
    revokedAt: key.revokedAt?.toISOString() ?? null,
    createdAt: key.createdAt.toISOString(),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
