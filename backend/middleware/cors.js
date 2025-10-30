// middleware/cors.js
import cors from "cors";

// Build allowlist from common dev URLs and env vars
const allowed = new Set([
  process.env.FRONTEND_ORIGIN,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
]);

// Honor env overrides if provided
if (process.env.FRONTEND_URL) allowed.add(process.env.FRONTEND_URL);
if (process.env.CORS_ORIGIN) allowed.add(process.env.CORS_ORIGIN);

// Also allow 127.0.0.1 on common Vite ports
const localRegex = /^http:\/\/(localhost|127\.0\.0\.1):517\d$/;

export const corsMiddleware = cors({
  origin(origin, cb) {
    // allow non-browser tools (no Origin header)
    if (!origin) return cb(null, true);
    if (allowed.has(origin) || localRegex.test(origin)) return cb(null, true);

    // Explicit 403 for blocked origins
    const err = new Error("Not allowed by CORS");
    // @ts-ignore - express typing
    err.status = 403;
    return cb(err);
  },
  credentials: true,
});
