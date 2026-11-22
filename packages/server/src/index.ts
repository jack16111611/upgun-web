import { Server, createEndpoint, createRouter, matchMaker } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { ARENA_ROOM_NAME, initRapier } from "@upgun/shared";
import { ArenaRoom } from "./rooms/ArenaRoom";

const DEFAULT_ORIGIN = "http://localhost:5173";
const PORT = Number(process.env.PORT) || 2567;

function parseAllowedOrigins(raw?: string): string[] {
  if (!raw) {
    return [DEFAULT_ORIGIN];
  }
  const origins = raw
    .split(",")
    .map((entry) => entry.trim().replace(/\/+$/, ""))
    .filter((entry) => entry.length > 0);
  return origins.length > 0 ? origins : [DEFAULT_ORIGIN];
}

function resolveCorsOrigin(requestOrigin: string | null, allowed: readonly string[]): string {
  const normalized = requestOrigin?.trim().replace(/\/+$/, "") ?? "";
  if (allowed.includes("*")) {
    return normalized || "*";
  }
  if (normalized && allowed.includes(normalized)) {
    return normalized;
  }
  return allowed[0] ?? DEFAULT_ORIGIN;
}

function resolveStatusCorsOrigin(requestOrigin: string | null, allowed: readonly string[]): string {
  const normalized = requestOrigin?.trim().replace(/\/+$/, "") ?? "";
  if (normalized && (allowed.includes("*") || allowed.includes(normalized))) {
    return normalized;
  }
  return "*";
}

const ALLOWED_ORIGINS = parseAllowedOrigins(process.env.CLIENT_ORIGIN);

// Global CORS headers & OPTIONS (204) preflight handling via Colyseus router middleware
matchMaker.controller.getCorsHeaders = (headers: Headers) => ({
  "Access-Control-Allow-Origin": resolveCorsOrigin(headers.get("origin"), ALLOWED_ORIGINS),
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  "Access-Control-Allow-Methods": "GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS",
  "Vary": "Origin",
});

const gameServer = new Server({
  transport: new WebSocketTransport(),
});

gameServer.router = createRouter({
  status: createEndpoint("/api/status", { method: "GET" }, async (ctx) => {
    const allowOrigin = resolveStatusCorsOrigin(ctx.headers?.get("origin") ?? null, ALLOWED_ORIGINS);
    return Response.json(
      { ok: true, timestamp: Date.now() },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": allowOrigin,
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Vary": "Origin",
        },
      },
    );
  }),
  health: createEndpoint("/health", { method: "GET" }, async (ctx) => {
    const allowOrigin = resolveStatusCorsOrigin(ctx.headers?.get("origin") ?? null, ALLOWED_ORIGINS);
    return Response.json(
      { ok: true, uptime: process.uptime() },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": allowOrigin,
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Vary": "Origin",
        },
      },
    );
  }),
});

gameServer.define(ARENA_ROOM_NAME, ArenaRoom);

async function bootstrap(): Promise<void> {
  await initRapier();
  await gameServer.listen(PORT, "0.0.0.0");
  console.log(
    `[upgun-server] Listening on http://0.0.0.0:${PORT} (CORS: ${ALLOWED_ORIGINS.join(", ")})`,
  );
}

bootstrap().catch((error: unknown) => {
  console.error("[upgun-server] Failed to start:", error);
  process.exit(1);
});
