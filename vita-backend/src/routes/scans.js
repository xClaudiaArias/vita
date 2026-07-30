import express from "express";
import pool from "../db.js";

const router = express.Router();


async function getResumeWithSections(resumeId) {
  const rowsResult = await pool.query(
    `SELECT s.id AS section_id, s.type AS section_type,
            b.id AS bullet_id, b.content
     FROM resume_sections s
     LEFT JOIN resume_bullets b ON b.section_id = s.id
     WHERE s.resume_id = $1
     ORDER BY s.sort_order, b.sort_order`,
    [resumeId]
  );

  const sectionsMap = new Map();
  for (const row of rowsResult.rows) {
    if (!sectionsMap.has(row.section_type)) {
      sectionsMap.set(row.section_type, []);
    }
    if (row.bullet_id) {
      sectionsMap.get(row.section_type).push({
        id: row.bullet_id,
        content: row.content,
      });
    }
  }
  return sectionsMap;
}


router.post("/", async (req, res) => {
  const { resume_id, job_posting_id } = req.body;

  if (!resume_id || !job_posting_id) {
    return res
      .status(400)
      .json({ error: "resume_id and job_posting_id are required" });
  }

  try {
    // 1. Load the resume content and the job posting text
    const sectionsMap = await getResumeWithSections(resume_id);
    const jobResult = await pool.query(
      "SELECT raw_description, company, role_title FROM job_postings WHERE id = $1",
      [job_posting_id]
    );

    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: "Job posting not found" });
    }
    const job = jobResult.rows[0];

    const resumeText = Array.from(sectionsMap.entries())
      .map(
        ([type, bullets]) =>
          `${type.toUpperCase()}:\n${bullets.map((b) => `- [${b.id}] ${b.content}`).join("\n")}`
      )
      .join("\n\n");

    // 2. Ask Claude to compare them and return structured JSON.
    // We're explicit that it must return ONLY JSON, nothing else,
    // so we can parse the response directly.
    const prompt = `You are comparing a resume against a job posting to help the candidate tailor their resume.

JOB POSTING (${job.company} — ${job.role_title}):
${job.raw_description}

RESUME (bullets tagged with their IDs in brackets):
${resumeText}

Respond with ONLY valid JSON (no markdown fences, no preamble) in this exact shape:
{
  "match_score": <integer 0-100>,
  "strengths": ["<short phrase on what already aligns well>", ...],
  "suggestions": [
    {
      "bullet_id": "<id from the resume above, or null if this is a brand new bullet>",
      "section_type": "<required only if bullet_id is null — e.g. 'experience'>",
      "suggested_text": "<the proposed bullet text>",
      "reason": "<one short sentence on why this helps, referencing the job posting>"
    }
  ]
}

Keep suggestions to 2-4 of the highest-impact changes. Be encouraging and specific, not generic.`;

    const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`Anthropic API error: ${errText}`);
    }

    const aiData = await aiResponse.json();
    const rawText = aiData.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      throw new Error("Could not parse AI response as JSON: " + rawText.slice(0, 200));
    }

    // 3. Store the scan and its suggestions in a transaction
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const scanResult = await client.query(
        `INSERT INTO scans (resume_id, job_posting_id, match_score)
         VALUES ($1, $2, $3) RETURNING id, created_at`,
        [resume_id, job_posting_id, parsed.match_score]
      );
      const scanId = scanResult.rows[0].id;

      const storedSuggestions = [];
      for (const s of parsed.suggestions || []) {
        const result = await client.query(
          `INSERT INTO scan_suggestions (scan_id, bullet_id, section_type, suggested_text, reason)
           VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [scanId, s.bullet_id || null, s.section_type || null, s.suggested_text, s.reason]
        );
        storedSuggestions.push({ id: result.rows[0].id, ...s, status: "pending" });
      }

      await client.query("COMMIT");

      res.status(201).json({
        id: scanId,
        match_score: parsed.match_score,
        strengths: parsed.strengths,
        suggestions: storedSuggestions,
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;


// TODO: 
// Set uo anthropic key.
// Not working at the moment due to support error.