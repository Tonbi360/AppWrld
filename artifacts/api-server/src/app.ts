import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { authMiddleware } from "./middlewares/authMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";
import { createRateLimiter } from "./middlewares/rateLimiter";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// CORS allowlist via env CORS_ORIGINS (comma-separated); default to true for flexibility
const rawOrigins = process.env.CORS_ORIGINS ?? "";
const allowedOrigins = rawOrigins.split(",").map((s) => s.trim()).filter(Boolean);
app.use(
  cors({
    credentials: true,
    origin: allowedOrigins.length ? ((origin, cb) => {
      if (!origin) return cb(null, false);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    }) : true,
  }),
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// General rate limiter
app.use(createRateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }));
// Stricter limiter for authentication routes
app.use("/api/auth", createRateLimiter({ windowMs: 60 * 1000, max: 10 }));
app.use(authMiddleware);

app.use("/api", router);

export default app;
