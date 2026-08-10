import express from "express";
import pool from "../db.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { job_posting_id, resume_id, status } = req.body;

  if (!job_posting_id) {
    return res.status(400).json({ error: "job_posting_id is required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO applications (user_id, job_posting_id, resume_id, status)
       VALUES ($1, $2, $3, COALESCE($4, 'saved'))
       RETURNING *`,
      [req.userId, job_posting_id, resume_id || null, status || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         a.id, a.status, a.applied_at, a.interview_at, a.deadline_at, a.notes, a.created_at,
         jp.company, jp.role_title,
         latest_scan.match_score
       FROM applications a
       JOIN job_postings jp ON jp.id = a.job_posting_id
       LEFT JOIN LATERAL (
         SELECT match_score
         FROM scans s
         WHERE s.job_posting_id = a.job_posting_id
           AND s.resume_id = a.resume_id
         ORDER BY s.created_at DESC
         LIMIT 1
       ) latest_scan ON true
       WHERE a.user_id = $1
       ORDER BY a.created_at DESC`,
      [req.userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { status, applied_at, interview_at, deadline_at, notes } = req.body;

  try {
    const result = await pool.query(
      `UPDATE applications SET
         status = COALESCE($1, status),
         applied_at = COALESCE($2, applied_at),
         interview_at = COALESCE($3, interview_at),
         deadline_at = COALESCE($4, deadline_at),
         notes = COALESCE($5, notes)
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [status, applied_at, interview_at, deadline_at, notes, id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Application not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
