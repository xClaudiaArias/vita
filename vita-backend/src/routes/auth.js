import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../db.js";

const router = express.Router();

function generateToken(userId) {
  // Signs a token containing the user's ID, valid for 7 days.
  // Anyone holding this token can prove "I am this user" without
  // sending a password on every request.
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}


router.post("/signup", async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: "email, password, and name are required" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  try {
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    // Never store the raw password — bcrypt "hashes" it into something
    // one-way (can't be reversed back into the original password), with
    // a random "salt" baked in so two people with the same password
    // don't end up with the same stored hash.
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name)
       VALUES ($1, $2, $3) RETURNING id, email, name`,
      [email, passwordHash, name]
    );
    const user = result.rows[0];

    const token = generateToken(user.id);
    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  try {
    const result = await pool.query(
      "SELECT id, email, name, password_hash FROM users WHERE email = $1",
      [email]
    );

    // Deliberately vague error message on both "no such email" and "wrong
    // password" — telling an attacker which one was wrong makes it easier
    // for them to guess valid emails on your platform.
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0];
    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = generateToken(user.id);
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


// Returns the current user's info based on their token.
// Useful for the frontend to check "am I still logged in?" on page load.

router.get("/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Not logged in" });
  }

  try {
    const payload = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
    const result = await pool.query(
      "SELECT id, email, name, avatar_url, current_streak, weekly_goal FROM users WHERE id = $1",
      [payload.userId]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "User no longer exists" });
    }
    res.json(result.rows[0]);
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
});

// ─────────────────────────────────────────
// PATCH /auth/me
// Updates the logged-in user's own settings: name, weekly goal, avatar.
// Requires a valid token, same as any protected route — but since this
// router is mounted publicly (before requireAuth in index.js), we verify
// the token manually here rather than relying on that middleware.
// ─────────────────────────────────────────
router.patch("/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Not logged in" });
  }

  let userId;
  try {
    const payload = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
    userId = payload.userId;
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  const { name, weekly_goal, avatar_url } = req.body;

  if (weekly_goal !== undefined && (!Number.isInteger(weekly_goal) || weekly_goal < 1)) {
    return res.status(400).json({ error: "weekly_goal must be a positive whole number" });
  }

  try {
    const result = await pool.query(
      `UPDATE users SET
         name = COALESCE($1, name),
         weekly_goal = COALESCE($2, weekly_goal),
         avatar_url = COALESCE($3, avatar_url)
       WHERE id = $4
       RETURNING id, email, name, avatar_url, current_streak, weekly_goal`,
      [name || null, weekly_goal ?? null, avatar_url || null, userId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
