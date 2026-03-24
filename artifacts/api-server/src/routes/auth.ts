import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "@workspace/db";

const router = Router();

router.post("/signup", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) { res.status(400).json({ error: "Email and password required" }); return; }
    if (password.length < 6) { res.status(400).json({ error: "Password must be at least 6 characters" }); return; }

    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email.toLowerCase()]);
    if (existing.rows.length > 0) { res.status(409).json({ error: "An account with that email already exists" }); return; }

    const hash = await bcrypt.hash(password, 10);
    const userRole = role === 'creator' ? 'creator' : 'supporter';
    const { rows } = await pool.query(
      "INSERT INTO users (email, password_hash, display_name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, display_name, role, wallet_balance, created_at",
      [email.toLowerCase(), hash, email.split("@")[0], userRole]
    );
    res.json({ user: rows[0] });
  } catch (e: any) {
    console.error("Signup error:", e);
    res.status(500).json({ error: e.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) { res.status(400).json({ error: "Email and password required" }); return; }

    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email.toLowerCase()]);
    if (rows.length === 0) { res.status(401).json({ error: "Invalid email or password" }); return; }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) { res.status(401).json({ error: "Invalid email or password" }); return; }

    const { password_hash, ...safeUser } = user;

    const { rows: postStats } = await pool.query(
      "SELECT COALESCE(SUM(views),0) as total_views, COALESCE(SUM(likes),0) as total_likes, COUNT(*) as total_posts FROM posts WHERE user_id = $1",
      [user.id]
    );
    const { rows: earningsRows } = await pool.query(
      "SELECT COALESCE(SUM(amount),0) as total_earnings FROM earnings WHERE user_id = $1",
      [user.id]
    );

    res.json({
      user: {
        ...safeUser,
        total_views: parseInt(postStats[0]?.total_views) || 0,
        total_likes: parseInt(postStats[0]?.total_likes) || 0,
        total_posts: parseInt(postStats[0]?.total_posts) || 0,
        total_earnings: parseFloat(earningsRows[0]?.total_earnings) || 0,
      }
    });
  } catch (e: any) {
    console.error("Login error:", e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
