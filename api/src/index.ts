import http from "node:http";
import { createApp } from "./app.js";
import { attachSocket } from "./socket.js";
import { validateEnv } from "./lib/env.js";

validateEnv();

const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4000);
const host = process.env.HOST ?? "0.0.0.0";
const app = createApp();
const server = http.createServer(app);

attachSocket(server);

server.listen(port, host, () => {
  console.log(`GlassNet API → http://${host}:${port}`);
});
