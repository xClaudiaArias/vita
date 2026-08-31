import express from "express";
import multer from "multer";
import * as pdfParse from 'pdf-parse';
import mammoth from "mammoth";
import pool from "../db.js";

const router = express.Router();

// Files are handled in memory (never written to disk) and capped at 5MB —
// plenty for a resume, small enough to not be a DoS vector.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });


async function createResumeWithSections(userId, label, sections) {
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
    return resumeId;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

router.post("/", async (req, res) => {
  const { label, sections } = req.body;

  if (!label) {
    return res.status(400).json({ error: "label is required" });
  }

  try {
    const resumeId = await createResumeWithSections(req.userId, label, sections);
    res.status(201).json({ id: resumeId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/parse", upload.single("file"), async (req, res) => {
  const label = req.body.label;

  if (!label || !label.trim()) {
    return res.status(400).json({ error: "label is required" });
  }

  try {
    let rawText = "";

    if (req.file) {
      const mimetype = req.file.mimetype;
      if (mimetype === "application/pdf") {
        const parsed = await pdfParse(req.file.buffer);
        rawText = parsed.text;
      } else if (mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        const parsed = await mammoth.extractRawText({ buffer: req.file.buffer });
        rawText = parsed.value;
      } else if (mimetype === "text/plain") {
        rawText = req.file.buffer.toString("utf-8");
      } else {
        return res.status(400).json({ error: "Unsupported file type — please upload a PDF, DOCX, or TXT file." });
      }
    } else if (req.body.text) {
      rawText = req.body.text;
    } else {
      return res.status(400).json({ error: "Provide either a file upload or pasted text." });
    }

    rawText = rawText.trim();
    if (!rawText) {
      return res.status(400).json({ error: "Couldn't find any readable text in that file." });
    }

    // Ask Claude to turn free-form resume text into our exact
    // sections/bullets shape — same "respond with ONLY JSON" pattern
    // used by the scan route, so we can parse the response directly.
    const prompt = `You are extracting structured content from a resume so it can be stored in a database.

RESUME TEXT:
${rawText.slice(0, 12000)}

Respond with ONLY valid JSON (no markdown fences, no preamble) in this exact shape:
{
  "sections": [
    { "type": "summary", "bullets": ["<a short professional summary, one bullet is fine>"] },
    { "type": "experience", "bullets": ["<one bullet per accomplishment/responsibility, across all jobs, most recent first>"] },
    { "type": "skills", "bullets": ["<individual skills or short skill groupings>"] },
    { "type": "education", "bullets": ["<degree, school, and year if present>"] }
  ]
}

Rules:
- Use ONLY these four section types: summary, experience, skills, education.
- Omit a section entirely if the resume has nothing for it — don't invent content.
- Keep each bullet as close to the original wording as possible; you're extracting and organizing, not rewriting.
- Split multi-sentence experience entries into separate bullets rather than one long paragraph.`;

    const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2000,
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

    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      throw new Error("Could not parse the AI's response as JSON: " + responseText.slice(0, 200));
    }

    const resumeId = await createResumeWithSections(req.userId, label.trim(), parsed.sections);
    res.status(201).json({ id: resumeId, sections: parsed.sections });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
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


router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { label } = req.body;

  if (!label || !label.trim()) {
    return res.status(400).json({ error: "label is required" });
  }

  try {
    const result = await pool.query(
      `UPDATE resumes SET label = $1, updated_at = now()
       WHERE id = $2 AND user_id = $3
       RETURNING id, label, updated_at`,
      [label.trim(), id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Resume not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM resumes WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Resume not found" });
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
