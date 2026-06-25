import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { env } from "cloudflare:workers";

import { fileObject } from "~/db/storage-schema";
import { auth } from "~/features/auth/server";

import * as storageSchema from "~/db/storage-schema";

const db = drizzle(env.DB, { schema: storageSchema });

export interface StoredFileSummary {
  id: string;
  fileName: string;
  contentType: string;
  size: number;
  createdAt: string;
}

export async function listFiles(headers: Headers) {
  const userId = await requireStorageUserId(headers);
  const files = await db
    .select()
    .from(fileObject)
    .where(eq(fileObject.userId, userId))
    .orderBy(desc(fileObject.createdAt));

  return files.map(toSummary);
}

export async function storeFile(headers: Headers, request: Request) {
  const userId = await requireStorageUserId(headers);
  const body = request.body;

  if (!body) {
    throw new StorageError("missing_body", "Request body is required.", 400);
  }

  const fileName = sanitizeFileName(
    request.headers.get("x-shipstack-filename") ?? "upload.bin",
  );
  const contentType =
    request.headers.get("content-type") ?? "application/octet-stream";
  const size = Number(request.headers.get("content-length") ?? 0);

  if (!Number.isFinite(size) || size < 0) {
    throw new StorageError("invalid_size", "Content length is invalid.", 400);
  }

  const id = crypto.randomUUID();
  const objectKey = `${userId}/${id}/${fileName}`;
  const now = new Date();

  await env.FILES.put(objectKey, body, {
    httpMetadata: {
      contentType,
    },
  });

  const record = {
    id,
    userId,
    objectKey,
    fileName,
    contentType,
    size,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(fileObject).values(record);

  return toSummary(record);
}

export async function deleteFile(headers: Headers, fileId: string | null) {
  const userId = await requireStorageUserId(headers);

  if (!fileId) {
    throw new StorageError("missing_file_id", "File id is required.", 400);
  }

  const [file] = await db
    .select()
    .from(fileObject)
    .where(eq(fileObject.id, fileId))
    .limit(1);

  if (!file || file.userId !== userId) {
    throw new StorageError("not_found", "File was not found.", 404);
  }

  await env.FILES.delete(file.objectKey);
  await db.delete(fileObject).where(eq(fileObject.id, fileId));

  return { id: file.id, deleted: true };
}

export class StorageError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

async function requireStorageUserId(headers: Headers) {
  const session = await auth.api.getSession({ headers });

  if (!session?.user?.id) {
    throw new StorageError("unauthorized", "Authentication is required.", 401);
  }

  return session.user.id;
}

function sanitizeFileName(fileName: string) {
  const cleanName = fileName
    .trim()
    .replace(/[/\\]/g, "-")
    .replace(/[^\w. -]/g, "")
    .slice(0, 160);

  return cleanName || "upload.bin";
}

function toSummary(file: {
  id: string;
  fileName: string;
  contentType: string;
  size: number;
  createdAt: Date;
}): StoredFileSummary {
  return {
    id: file.id,
    fileName: file.fileName,
    contentType: file.contentType,
    size: file.size,
    createdAt: file.createdAt.toISOString(),
  };
}
