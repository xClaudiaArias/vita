import express from "express";
import pool from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: "user_id query param is required" });
  }

  try {
    const [userResult, weeklyResult, upcomingResult, matchesResult, activityResult] =
      await Promise.all([
        // Basic profile + streak/goal settings
        pool.query(
          "SELECT name, avatar_url, current_streak, weekly_goal FROM users WHERE id = $1",
          [user_id]
        ),

        // How many applications were submitted since the start of this week
        pool.query(
          `SELECT COUNT(*)::int AS count FROM applications
           WHERE user_id = $1 AND applied_at >= date_trunc('week', now())`,
          [user_id]
        ),

        // Interviews and deadlines coming up, combined and sorted by soonest.
        // UNION ALL merges two similarly-shaped queries into one result set.
        pool.query(
          `SELECT 'interview' AS type, jp.company, jp.role_title, a.interview_at AS date
             FROM applications a JOIN job_postings jp ON jp.id = a.job_posting_id
             WHERE a.user_id = $1 AND a.interview_at > now()
           UNION ALL
           SELECT 'deadline' AS type, jp.company, jp.role_title, a.deadline_at AS date
             FROM applications a JOIN job_postings jp ON jp.id = a.job_posting_id
             WHERE a.user_id = $1 AND a.deadline_at > now()
           ORDER BY date ASC
           LIMIT 5`,
          [user_id]
        ),

        // Saved-but-not-yet-applied postings, standing in for "new matches"
        pool.query(
          `SELECT a.id, jp.company, jp.role_title
             FROM applications a JOIN job_postings jp ON jp.id = a.job_posting_id
             WHERE a.user_id = $1 AND a.status = 'saved'
             ORDER BY a.created_at DESC
             LIMIT 5`,
          [user_id]
        ),

        // Recent activity: new applications + resume updates, merged and sorted
        pool.query(
          `SELECT 'application' AS type,
                  (jp.company || ' — ' || jp.role_title) AS description,
                  a.created_at AS date
             FROM applications a JOIN job_postings jp ON jp.id = a.job_posting_id
             WHERE a.user_id = $1
           UNION ALL
           SELECT 'resume' AS type,
                  ('Updated ' || r.label || ' resume') AS description,
                  r.updated_at AS date
             FROM resumes r
             WHERE r.user_id = $1
           ORDER BY date DESC
           LIMIT 5`,
          [user_id]
        ),
      ]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      user: userResult.rows[0],
      weekly_progress: weeklyResult.rows[0].count,
      upcoming: upcomingResult.rows,
      new_matches: matchesResult.rows,
      recent_activity: activityResult.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
