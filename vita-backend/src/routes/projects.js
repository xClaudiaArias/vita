import express from "express";
import pool from "../db.js";

const router = express.Router();


// POST /projects
// Body: { "user_id", "title", "description", "thumbnail_url", "link_url", "tags": ["Figma","Systems"] }

router.post("/", async (req, res) => {
  const { user_id, title, description, thumbnail_url, link_url, tags } = req.body;

  if (!user_id || !title) {
    return res.status(400).json({ error: "user_id and title are required" });
  }

  try {
    // Getting the current max sort_order for this user so new projects
    // land at the end of the list by default, rather than all at 0.
    const orderResult = await pool.query(
      "SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM projects WHERE user_id = $1",
      [user_id]
    );
    const nextOrder = orderResult.rows[0].next_order;

    const result = await pool.query(
      `INSERT INTO projects (user_id, title, description, thumbnail_url, link_url, tags, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [user_id, title, description || null, thumbnail_url || null, link_url || null, tags || [], nextOrder]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


// GET /projects?user_id=uuid
// Returns a user's portfolio, in display order.

router.get("/", async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: "user_id query param is required" });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM projects WHERE user_id = $1 ORDER BY sort_order",
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


// PATCH /projects/:id

router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { title, description, thumbnail_url, link_url, tags, sort_order } = req.body;

  try {
    const result = await pool.query(
      `UPDATE projects SET
         title = COALESCE($1, title),
         description = COALESCE($2, description),
         thumbnail_url = COALESCE($3, thumbnail_url),
         link_url = COALESCE($4, link_url),
         tags = COALESCE($5, tags),
         sort_order = COALESCE($6, sort_order)
       WHERE id = $7
       RETURNING *`,
      [title, description, thumbnail_url, link_url, tags, sort_order, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


// DELETE /projects/:id

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM projects WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
