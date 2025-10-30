// backend/server.js
import express from "express";
import 'dotenv/config';
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

import { corsMiddleware } from "./middleware/cors.js";
import { errorHandler } from "./middleware/error.js";
import { requireAuth, requireInstructor, requireStudent } from "./middleware/authMiddleware.js";

import instructorsRoutes from "./routes/instructors.routes.js";
import reportsRoutes from "./routes/reports.routes.js";
import usersRoutes from "./routes/users.routes.js";
import coursesRoutes from "./routes/courses.routes.js";
import lessonsRoutes from "./routes/lessons.routes.js";
import classroomsRoutes from "./routes/classrooms.routes.js";
import classroomSupervisorsRoutes from "./routes/classroomSupervisors.routes.js";
import enrolmentsRoutes from "./routes/enrolments.routes.js";
import studentsProgressRoutes from "./routes/studentsProgress.routes.js";
import completionStatusRoutes from "./routes/completionStatus.routes.js";
import authRoutes from "./routes/auth.routes.js";
import instructorCoursesRouter from "./routes/instructorCourses.routes.js";
import cors from "cors"; 
import { q } from "./db.js";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";

// Student sign-up middlewares
import { normalizeEmail } from "./middleware/normalizeEmail.js";
import { validateStudentSignup } from "./middleware/validateStudentSignup.js";
import { blockNonStudentEmail } from "./middleware/blockNonStudentEmail.js";
import { signupStudent } from "./controllers/authController.js";

const app = express();
app.set("trust proxy", 1); // needed for secure cookies behind Railway

// ---------- Session + Passport setup ----------
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // cross-site
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:4000', 
    'https://eduva-lms.vercel.app', // Your Vercel domain
    'https://eduva-lms-production.up.railway.app' // Your Railway domain
  ],
  credentials: true
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// ---------- Middleware ----------
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use(express.json());

// ---------- Routes ----------
app.use("/api/auth", authRoutes);

// Health check route
app.get("/api/health", async (_req, res) => {
  try {
    await q("SELECT 1");
    res.json({ api: "ok", db: "ok" });
  } catch (e) {
    res.status(500).json({ api: "ok", db: "fail", error: e.message });
  }
});
app.get("/", (_req, res) => res.status(200).send("ok"));
app.get("/health", (_req, res) => res.status(200).send("ok"));
// Auth routes
app.get("/api/auth/me", (req, res) => {
  if (!req.user) return res.status(401).json({ user: null });
  res.json({ user: req.user });
});

// Student-only profile route
app.get("/api/student/profile", requireStudent, (req, res) =>
  res.json({ user: req.user })
);

// Student email+password sign-up
app.post(
  "/api/auth/signup",
  normalizeEmail("email"),
  validateStudentSignup,
  blockNonStudentEmail,
  signupStudent
);

// Mount all API routes
app.use("/api/users", usersRoutes);
app.use("/api/courses", coursesRoutes);
app.use("/api/lessons", lessonsRoutes);
app.use("/api/classrooms", classroomsRoutes);
app.use("/api/classroomSupervisors", classroomSupervisorsRoutes);
app.use("/api/enrolments", enrolmentsRoutes);
app.use("/api/students", studentsProgressRoutes);
app.use("/api/completionStatus", completionStatusRoutes);
app.use("/api/instructor-courses", instructorCoursesRouter);
app.use("/api/instructors", instructorsRoutes);
app.use("/api/reports", reportsRoutes);

// ---------- Serve frontend in production ----------
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (process.env.NODE_ENV === "production") {
  const frontendPath = path.join(__dirname, "../frontend/dist");
  app.use(express.static(frontendPath));

  app.get("*", (_, res) =>
    res.sendFile(path.join(frontendPath, "index.html"))
  );
}

// ---------- Error handler ----------
app.use(errorHandler);

// ---------- Start server ----------
const port = process.env.PORT || 4000;
app.listen(port, '0.0.0.0', () => {
  console.log(`🌐 API running on http://localhost:${port}`);
});
