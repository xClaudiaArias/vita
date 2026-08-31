import express from "express";
import pool from "../db.js";

const router = express.Router();

// ─────────────────────────────────────────
// POST /job-postings
// Stores a scanned job posting. Expects:
// { "company": "Notion", "role_title": "Senior Product Designer",
//   "source_url": "https://...", "raw_description": "full text..." }
// ─────────────────────────────────────────
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

// ─────────────────────────────────────────
// POST /job-postings/extract
// Body: { "text": "the pasted job description" }
// Asks Claude to pull out just the company and role title from text
// the user already pasted — so the scanner doesn't have to ask for
// them again as blank fields. Does NOT create a job posting; that
// still happens via POST / at scan time, unchanged.
// ─────────────────────────────────────────
router.post("/extract", async (req, res) => {
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: "text is required" });
  }

  try {
    const prompt = `Extract the company name and role title from this job posting text. Respond with ONLY valid JSON (no markdown fences, no preamble) in this exact shape:
{ "company": "<company name, or empty string if genuinely unclear>", "role_title": "<role title, or empty string if genuinely unclear>" }

JOB POSTING TEXT:
${text.slice(0, 6000)}`;

    const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 150,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`Anthropic API error: ${errText}`);
    }

    const aiData = await aiResponse.json();
    const responseText = aiData.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
      .trim();

    const parsed = JSON.parse(responseText);
    res.json({ company: parsed.company || "", role_title: parsed.role_title || "" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
