// middleware/cors.js
import cors from "cors";

// Function that builds allowlist at runtime (not during build)
function getAllowedOrigins() {
  const allowed = new Set([
    process.env.FRONTEND_ORIGIN,
    process.env.FRONTEND_URL,
    process.env.CORS_ORIGIN,
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
  ].filter(Boolean)); // Remove undefined values

  return allowed;
}

// Also allow 127.0.0.1 on common Vite ports
const localRegex = /^http:\/\/(localhost|127\.0\.0\.1):517\d$/;

export const corsMiddleware = cors({
  origin(origin, cb) {
    // Build allowed list at runtime (not at import time)
    const allowed = getAllowedOrigins();
    
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