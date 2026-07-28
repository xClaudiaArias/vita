import express from "express";
import pool from "../db.js";

const router = express.Router();

// ───────────────────────────────────────── 
// POST /job-postings
// Stores a scanned job posting. Expects:
// { "company": "Notion", "role_title": "Senior Product Designer",
//   "source_url": "https://...", "raw_description": "full text..." }

router.post("/", async (req, res) => {
  const { company, role_title, source_url, raw_description } = req.body;

  if (!company || !role_title || !raw_description) {
    return res.status(400).json({
      error: "company, role_title, and raw_description are required",
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO job_postings (company, role_title, source_url, raw_description)
       VALUES ($1, $2, $3, $4)
       RETURNING id, company, role_title, source_url, created_at`,
      [company, role_title, source_url || null, raw_description]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// GET /job-postings/:id
// ─────────────────────────────────────────
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM job_postings WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Job posting not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
