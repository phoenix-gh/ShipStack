export interface ApiError {
  code: string;
  message: string;
}

export interface ApiEnvelope<T> {
  data: T | null;
  error: ApiError | null;
  requestId: string;
}

export function ok<T>(data: T, init?: ResponseInit) {
  return json<T>(
    {
      data,
      error: null,
      requestId: createRequestId(),
    },
    init,
  );
}

export function fail(error: ApiError, init?: ResponseInit) {
  return json<never>(
    {
      data: null,
      error,
      requestId: createRequestId(),
    },
    {
      status: init?.status ?? 400,
      headers: init?.headers,
    },
  );
}

function json<T>(body: ApiEnvelope<T>, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("content-type", "application/json; charset=utf-8");

  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  });
}

function createRequestId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `req_${Date.now().toString(36)}`;
}
