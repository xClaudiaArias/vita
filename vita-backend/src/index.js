import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./db.js";
import resumesRouter from "./routes/resumes.js";
import jobPostingsRouter from "./routes/jobPostings.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/resumes", resumesRouter);
app.use("/job-postings", jobPostingsRouter);

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
