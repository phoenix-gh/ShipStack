interface CorsOptions {
  methods?: string[];
  requestHeaders?: string[];
  trustedOrigins?: string;
}

const defaultMethods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
const defaultRequestHeaders = ["content-type", "authorization"];

export function withCors(
  request: Request,
  response: Response,
  options: CorsOptions = {},
) {
  const headers = new Headers(response.headers);
  applyCorsHeaders(headers, request, options);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function preflight(request: Request, options: CorsOptions = {}) {
  const headers = new Headers();
  applyCorsHeaders(headers, request, options);

  return new Response(null, {
    status: 204,
    headers,
  });
}

function applyCorsHeaders(
  headers: Headers,
  request: Request,
  options: CorsOptions,
) {
  const origin = request.headers.get("origin");

  headers.append("vary", "Origin");

  if (!origin || !isTrustedOrigin(origin, options.trustedOrigins)) {
    return;
  }

  headers.set("access-control-allow-origin", origin);
  headers.set("access-control-allow-credentials", "true");
  headers.set(
    "access-control-allow-methods",
    (options.methods ?? defaultMethods).join(", "),
  );
  headers.set(
    "access-control-allow-headers",
    (options.requestHeaders ?? defaultRequestHeaders).join(", "),
  );
}

function isTrustedOrigin(origin: string, trustedOrigins: string | undefined) {
  return parseTrustedOrigins(trustedOrigins).includes(origin);
}

function parseTrustedOrigins(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}
