import { createServer } from "node:http";
import { config } from "dotenv";
import next from "next";
import { initializeSocket } from "./src/lib/socket";

// Load environment variables
config({ path: ".env.development.local" });
config({ path: ".env.local" });
config({ path: ".env" });

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  // Initialize Socket.io
  const _io = initializeSocket(httpServer);

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> Socket.io server initialized`);
    });
});
