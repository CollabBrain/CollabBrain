import 'dotenv/config'; // PHẢI đứng đầu tiên — load .env trước mọi module khác

import express, { Express } from "express";
import cors from "cors";
import clientRoutes from "./routes/client/index.route";
import adminRoutes from "./routes/admin/index.route";

const app: Express = express();
const PORT = process.env.PORT || 3000;

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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

clientRoutes(app);
adminRoutes(app);

app.listen(PORT, () => {
  console.log(`App is listening on port ${PORT}`);
});