import express from "express";
import pool from "../db.js";

const router = express.Router();


router.post("/", async (req, res) => {
  const { label, sections } = req.body;
  const userId = req.userId; // from the verified token, not the request body

  if (!label) {
    return res.status(400).json({ error: "label is required" });
  }

  // We use a "client" (not the shared pool) here because we need several
  // queries to succeed or fail together as one transaction — if inserting
  // a bullet fails halfway through, we don't want a half-created resume
  // left behind in the database.
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const resumeResult = await client.query(
      "INSERT INTO resumes (user_id, label) VALUES ($1, $2) RETURNING id",
      [userId, label]
    );
    const resumeId = resumeResult.rows[0].id;

    for (let i = 0; i < (sections || []).length; i++) {
      const section = sections[i];

      const sectionResult = await client.query(
        "INSERT INTO resume_sections (resume_id, type, sort_order) VALUES ($1, $2, $3) RETURNING id",
        [resumeId, section.type, i]
      );
      const sectionId = sectionResult.rows[0].id;

      for (let j = 0; j < (section.bullets || []).length; j++) {
        await client.query(
          "INSERT INTO resume_bullets (section_id, content, sort_order) VALUES ($1, $2, $3)",
          [sectionId, section.bullets[j], j]
        );
      }
    }

    await client.query("COMMIT");
    res.status(201).json({ id: resumeId });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});


router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, label, updated_at FROM resumes WHERE user_id = $1 ORDER BY updated_at DESC",
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// PATCH /resumes/bullets/:bulletId
// Directly edits a bullet's content — used when the person manually
// edits a line in the resume editor (not via an AI suggestion).
// ─────────────────────────────────────────
router.patch("/bullets/:bulletId", async (req, res) => {
  const { bulletId } = req.params;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: "content is required" });
  }

  try {
    // Join through sections -> resumes to confirm this bullet actually
    // belongs to the logged-in user before allowing the edit — otherwise
    // a valid token would let someone edit ANY bullet by guessing its ID.
    const result = await pool.query(
      `UPDATE resume_bullets b SET content = $1, last_edited_at = now()
       FROM resume_sections s, resumes r
       WHERE b.id = $2 AND b.section_id = s.id AND s.resume_id = r.id AND r.user_id = $3
       RETURNING b.*`,
      [content, bulletId, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Bullet not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const resumeResult = await pool.query(
      "SELECT id, user_id, label, updated_at FROM resumes WHERE id = $1 AND user_id = $2",
      [id, req.userId]
    );

    if (resumeResult.rows.length === 0) {
      return res.status(404).json({ error: "Resume not found" });
    }

    const resume = resumeResult.rows[0];

    // One query joining sections + bullets is more efficient than looping
    // queries per section — this returns one row per bullet, ordered
    // correctly, and we reassemble it into a nested shape below.
    const rowsResult = await pool.query(
      `SELECT
         s.id AS section_id, s.type AS section_type, s.sort_order AS section_order,
         b.id AS bullet_id, b.content, b.sort_order AS bullet_order,
         b.last_edited_reason
       FROM resume_sections s
       LEFT JOIN resume_bullets b ON b.section_id = s.id
       WHERE s.resume_id = $1
       ORDER BY s.sort_order, b.sort_order`,
      [id]
    );

    // Reassemble the flat rows into { sections: [ { bullets: [...] } ] }
    const sectionsMap = new Map();
    for (const row of rowsResult.rows) {
      if (!sectionsMap.has(row.section_id)) {
        sectionsMap.set(row.section_id, {
          id: row.section_id,
          type: row.section_type,
          bullets: [],
        });
      }
      if (row.bullet_id) {
        sectionsMap.get(row.section_id).bullets.push({
          id: row.bullet_id,
          content: row.content,
          reason: row.last_edited_reason,
        });
      }
    }

    res.json({ ...resume, sections: Array.from(sectionsMap.values()) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
