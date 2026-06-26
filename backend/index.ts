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

// ——— CORS Origins: đọc từ env var FRONTEND_URLS (comma-separated) hoặc fallback localhost
// Ví dụ .env: FRONTEND_URLS=https://your-app.vercel.app,https://www.your-app.com
const defaultOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
]
const envOrigins = process.env.FRONTEND_URLS
  ? process.env.FRONTEND_URLS.split(",").map((o) => o.trim()).filter(Boolean)
  : []
const allowedOrigins = [...defaultOrigins, ...envOrigins]

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Cho phép requests không có origin (curl, Postman, mobile apps)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`CORS: Origin '${origin}' không được phép`))
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
})

app.use(cors(corsOptions))
app.set("io", io)
app.use(cookieParser());

io.use(socketAuthMiddleware)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
chatSocket(io)
clientRoutes(app);
adminRoutes(app);

server.listen(PORT, () => {
  console.log(`[Server] Listening on port ${PORT}`)
  console.log(`[CORS] Allowed origins: ${allowedOrigins.join(', ')}`)
})