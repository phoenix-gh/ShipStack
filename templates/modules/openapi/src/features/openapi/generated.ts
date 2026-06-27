export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "ShipStack API",
    version: "0.1.0",
  },
  servers: [{ url: "/" }],
  paths: {
    "/api/health": {
      get: {
        operationId: "getHealth",
        summary: "Health check",
        responses: {
          "200": {
            description: "Health check result",
          },
        },
      },
    },
  },
} as const;
