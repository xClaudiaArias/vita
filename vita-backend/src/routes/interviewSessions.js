import express from "express";
import pool from "../db.js";

const router = express.Router();

// POST /interview-sessions
// Body: { "user_id", "application_id" (optional) }
router.post("/", async (req, res) => {
  const { user_id, application_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: "user_id is required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO interview_sessions (user_id, application_id)
       VALUES ($1, $2) RETURNING *`,
      [user_id, application_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /interview-sessions/:id
// Returns the session with its full message history.

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const sessionResult = await pool.query(
      "SELECT * FROM interview_sessions WHERE id = $1",
      [id]
    );
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: "Session not found" });
    }

    const messagesResult = await pool.query(
      "SELECT id, sender, content, created_at FROM interview_messages WHERE session_id = $1 ORDER BY created_at",
      [id]
    );

    res.json({ ...sessionResult.rows[0], messages: messagesResult.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /interview-sessions/:id/messages
// Body: { "content": "the user's answer or message" }
// Stores the user's message, asks Claude for a reply in VITA's voice,
// stores that reply too, and returns both.
router.post("/:id/messages", async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: "content is required" });
  }

  try {
    const sessionResult = await pool.query(
      "SELECT * FROM interview_sessions WHERE id = $1",
      [id]
    );
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Load prior messages so Claude has the full conversation for context —
    // without this, every reply would ignore everything said before it.
    
    const historyResult = await pool.query(
      "SELECT sender, content FROM interview_messages WHERE session_id = $1 ORDER BY created_at",
      [id]
    );

    const conversationHistory = historyResult.rows.map((m) => ({
      role: m.sender === "user" ? "user" : "assistant",
      content: m.content,
    }));

    // Save the user's new message first
    const userMsgResult = await pool.query(
      `INSERT INTO interview_messages (session_id, sender, content)
       VALUES ($1, 'user', $2) RETURNING id, sender, content, created_at`,
      [id, content]
    );

    const systemPrompt = `You are VITA, a warm and encouraging interview prep coach. You're helping someone practice for a job interview. Ask realistic interview questions one at a time, and when they answer, give brief feedback that starts with what worked before offering one specific, actionable improvement. Keep responses conversational and concise — a few sentences, not an essay. If the person expresses nervousness, acknowledge it briefly and adjust your approach (slower pace, easier questions, more encouragement) rather than just reassuring them and continuing as before.`;

    const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 500,
        system: systemPrompt,
        messages: [...conversationHistory, { role: "user", content }],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`Anthropic API error: ${errText}`);
    }

    const aiData = await aiResponse.json();
    const replyText = aiData.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
      .trim();

    const vitaMsgResult = await pool.query(
      `INSERT INTO interview_messages (session_id, sender, content)
       VALUES ($1, 'vita', $2) RETURNING id, sender, content, created_at`,
      [id, replyText]
    );

    res.status(201).json({
      user_message: userMsgResult.rows[0],
      vita_message: vitaMsgResult.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
