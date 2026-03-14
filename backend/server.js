import express from "express";
import { createServer } from "http";
import cors from "cors";
import { Server } from "socket.io";
import setupSocket from "./socket.js";

const app = express();
app.use(cors());

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

setupSocket(io);

const PORT = 5000;

server.listen(PORT, () => {
  console.log(`Server running on https://localhost:${PORT}`);
});