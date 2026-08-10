import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./db.js";
import { requireAuth } from "./middleware/auth.js";
import authRouter from "./routes/auth.js";
import resumesRouter from "./routes/resumes.js";
import jobPostingsRouter from "./routes/jobPostings.js";
import scansRouter from "./routes/scans.js";
import applicationsRouter from "./routes/applications.js";
import projectsRouter from "./routes/projects.js";
import interviewSessionsRouter from "./routes/interviewSessions.js";
import dashboardRouter from "./routes/dashboard.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Public — no token needed 
app.use("/auth", authRouter);

// Everything below this line requires a valid token.
// requireAuth runs first, attaches req.userId, then the route handles the request.
app.use("/resumes", requireAuth, resumesRouter);
app.use("/job-postings", requireAuth, jobPostingsRouter);
app.use("/scans", requireAuth, scansRouter);
app.use("/applications", requireAuth, applicationsRouter);
app.use("/projects", requireAuth, projectsRouter);
app.use("/interview-sessions", requireAuth, interviewSessionsRouter);
app.use("/dashboard", requireAuth, dashboardRouter);

// Simple check that the server itself is up
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Confirms the server can actually reach Postgres
app.get("/health/db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ status: "ok", db_time: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`VITA backend running on http://localhost:${port}`);
});
