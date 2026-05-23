import http from "node:http";
import { createApp } from "./app.js";
import { attachSocket } from "./socket.js";
import { validateEnv } from "./lib/env.js";

validateEnv();

const port = Number(process.env.API_PORT ?? 4000);
const app = createApp();
const server = http.createServer(app);

attachSocket(server);

server.listen(port, () => {
  console.log(`GlassNet API → http://localhost:${port}`);
});
