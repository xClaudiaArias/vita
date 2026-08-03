import express from "express";
import pool from "../db.js";

const router = express.Router();


router.post("/", async (req, res) => {
  const { user_id, label, sections } = req.body;

  if (!user_id || !label) {
    return res.status(400).json({ error: "user_id and label are required" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const resumeResult = await client.query(
      "INSERT INTO resumes (user_id, label) VALUES ($1, $2) RETURNING id",
      [user_id, label]
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
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: "user_id query param is required" });
  }

  try {
    const result = await pool.query(
      "SELECT id, label, updated_at FROM resumes WHERE user_id = $1 ORDER BY updated_at DESC",
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


router.patch("/bullets/:bulletId", async (req, res) => {
  const { bulletId } = req.params;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: "content is required" });
  }

  try {
    const result = await pool.query(
      `UPDATE resume_bullets SET content = $1, last_edited_at = now()
       WHERE id = $2 RETURNING *`,
      [content, bulletId]
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


// Fetches a resume with its sections and bullets nested,
// matching the shape the frontend editor needs.
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const resumeResult = await pool.query(
      "SELECT id, user_id, label, updated_at FROM resumes WHERE id = $1",
      [id]
    );

    if (resumeResult.rows.length === 0) {
      return res.status(404).json({ error: "Resume not found" });
    }

    const resume = resumeResult.rows[0];

    // One query joining sections + bullets is more efficient than looping queries per section — this returns one row per bullet, ordered
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
