import 'dotenv/config'; // PHẢI đứng đầu tiên — load .env trước mọi module khác

import express, { Express } from "express";
import cors from "cors";
import clientRoutes from "./routes/client/index.route";
import adminRoutes from "./routes/admin/index.route";
import { Server } from "socket.io";
import http from "http";

import { socketAuthMiddleware } from "./middlewares/client/socket.middleware";
import { chatSocket } from './sockets/chat.socket';
import cookieParser from 'cookie-parser';

const app: Express = express();
const server = http.createServer(app)

const PORT = process.env.PORT || 3000;
const io = new Server(server, {
  cors: {
    origin: process.env.ORIGINAL_URL,
    credentials: true
  }
})
// ——— CORS
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:5176",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.set("io",io)
app.use(cookieParser()); 

io.use(socketAuthMiddleware)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
chatSocket(io)
clientRoutes(app);
adminRoutes(app);

server.listen(PORT, () => {
  console.log(`App is listening on ${PORT}`)
})