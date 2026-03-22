import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { swapsRouter } from "./routes/swaps.js";
import { eventBus } from "./services/eventBus.js";

export const buildApp = () => {
  const app = express();
  const server = createServer(app);
  const io = new Server(server, {
    cors: {
      origin: "*"
    }
  });

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "bswap-coordinator" });
  });

  app.use("/api/swaps", swapsRouter);

  io.on("connection", (socket) => {
    socket.emit("connected", { ok: true });
  });

  eventBus.on("swap:update", (swap) => {
    io.emit("swap:update", swap);
  });

  return { app, server };
};
