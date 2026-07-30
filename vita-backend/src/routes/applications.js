import express from "express";
import pool from "../db.js";

const router = express.Router();

// ─────────────────────────────────────────
// POST /applications
// Body: { "user_id", "job_posting_id", "resume_id" (optional), "status" (optional) }
// ─────────────────────────────────────────
router.post("/", async (req, res) => {
  const { user_id, job_posting_id, resume_id, status } = req.body;

  if (!user_id || !job_posting_id) {
    return res
      .status(400)
      .json({ error: "user_id and job_posting_id are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO applications (user_id, job_posting_id, resume_id, status)
       VALUES ($1, $2, $3, COALESCE($4, 'saved'))
       RETURNING *`,
      [user_id, job_posting_id, resume_id || null, status || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// GET /applications?user_id=uuid
// Returns the tracker list: company, role, status, match score
// (from the most recent scan for that resume+posting, if any),
// and the most relevant upcoming date.
// ─────────────────────────────────────────
router.get("/", async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: "user_id query param is required" });
  }

  try {
    // This joins across applications -> job_postings for company/role,
    // and pulls the latest scan's match_score for that same resume+posting
    // pair via a LATERAL subquery — it runs once per application row,
    // grabbing just the most recent matching scan instead of all of them.
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
      [user_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// PATCH /applications/:id
// Updates status and/or dates — e.g. moving from "applied" to "interviewing"
// ─────────────────────────────────────────
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
       WHERE id = $6
       RETURNING *`,
      [status, applied_at, interview_at, deadline_at, notes, id]
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
