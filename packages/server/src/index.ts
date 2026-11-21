import { Server, matchMaker } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { ARENA_ROOM_NAME, initRapier } from "@upgun/shared";
import { ArenaRoom } from "./rooms/ArenaRoom";

const PORT = Number(process.env.PORT ?? 2567);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

matchMaker.controller.getCorsHeaders = () => ({
  "Access-Control-Allow-Origin": CLIENT_ORIGIN,
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  "Access-Control-Allow-Methods": "GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS",
  "Vary": "Origin",
});

const gameServer = new Server({
  transport: new WebSocketTransport(),
});

gameServer.define(ARENA_ROOM_NAME, ArenaRoom);

async function bootstrap(): Promise<void> {
  await initRapier();
  await gameServer.listen(PORT);
  console.log(`[upgun-server] Listening on ws://localhost:${PORT} (CORS: ${CLIENT_ORIGIN})`);
}

bootstrap().catch((error: unknown) => {
  console.error("[upgun-server] Failed to start:", error);
  process.exit(1);
});
