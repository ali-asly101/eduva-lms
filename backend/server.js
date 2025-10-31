// backend/server.js - API ONLY (no frontend serving)
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
app.set("trust proxy", 1);

// ---------- Session + Passport setup ----------
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:4000', 
    'https://eduva-lms.vercel.app',
    'https://eduva-lms.onrender.com'
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

// ---------- Health Checks ----------
app.get("/", (_req, res) => {
  res.json({ 
    status: "ok",
    message: "Eduva LMS API",
    timestamp: new Date().toISOString()
  });
});

app.get("/health", (_req, res) => {
  res.json({ 
    status: "ok",
    uptime: process.uptime()
  });
});

app.get("/api/health", async (_req, res) => {
  try {
    await q("SELECT 1");
    res.json({ api: "ok", db: "ok" });
  } catch (e) {
    res.status(503).json({ api: "ok", db: "fail", error: e.message });
  }
});

// ---------- Routes ----------
app.use("/api/auth", authRoutes);

app.get("/api/auth/me", (req, res) => {
  if (!req.user) return res.status(401).json({ user: null });
  res.json({ user: req.user });
});

app.get("/api/student/profile", requireStudent, (req, res) =>
  res.json({ user: req.user })
);

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

// ---------- Error handler ----------
app.use(errorHandler);

// ---------- Start server ----------
const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database: ${process.env.DATABASE_URL ? 'Connected via DATABASE_URL' : 'Using local config'}`);
  console.log(`CORS origins configured for Vercel and Railway`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});