import { Router } from "express";
import { pool } from "@workspace/db";

const router = Router();

router.get("/posts", async (req, res) => {
  try {
    const type = req.query.type as string | undefined;
    let q = "SELECT p.*, u.display_name as author_name, u.wallet_balance FROM posts p LEFT JOIN users u ON p.user_id = u.id";
    const vals: any[] = [];
    if (type) {
      q += " WHERE p.type = $1";
      vals.push(type);
    }
    q += " ORDER BY p.created_at DESC LIMIT 50";
    const { rows } = await pool.query(q, vals);
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/posts", async (req, res) => {
  try {
    const { user_id, content, media_url, type, author, title, filter_class, thumbnail, episodes, description, categories, avatar } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO posts (user_id, content, media_url, type, author, title, filter_class, thumbnail, episodes, description, categories, avatar)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [user_id || null, content || '', media_url || '', type || 'post', author || '', title || '', filter_class || '', thumbnail || '', JSON.stringify(episodes || []), description || '', JSON.stringify(categories || []), avatar || '']
    );
    const io = req.app.get("io");
    if (io) io.emit("new_post", rows[0]);
    res.json(rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.patch("/posts/:id", async (req, res) => {
  try {
    const sets: string[] = [];
    const vals: any[] = [];
    let i = 1;
    for (const [k, v] of Object.entries(req.body)) {
      if (k === 'episodes' || k === 'categories') {
        sets.push(`${k} = $${i}`);
        vals.push(JSON.stringify(v));
      } else {
        sets.push(`${k} = $${i}`);
        vals.push(v);
      }
      i++;
    }
    vals.push(req.params.id);
    const { rows } = await pool.query(`UPDATE posts SET ${sets.join(",")} WHERE id = $${i} RETURNING *`, vals);
    res.json(rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete("/posts/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM posts WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/posts/:id/like", async (req, res) => {
  try {
    const { user_id } = req.body;
    const postId = req.params.id;
    await pool.query(
      "INSERT INTO likes (post_id, user_id) VALUES ($1, $2) ON CONFLICT (post_id, user_id) DO NOTHING",
      [postId, user_id]
    );
    const { rows } = await pool.query("SELECT * FROM posts WHERE id = $1", [postId]);
    const post = rows[0];
    const io = req.app.get("io");
    if (io) io.emit("like_update", { postId, likes: post?.likes, userId: post?.user_id });

    if (post?.user_id) {
      const { rows: userRows } = await pool.query("SELECT wallet_balance FROM users WHERE id = $1", [post.user_id]);
      if (userRows[0] && io) {
        io.emit("wallet_update", { userId: post.user_id, wallet_balance: parseFloat(userRows[0].wallet_balance) });
      }
    }
    res.json({ success: true, likes: post?.likes });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/posts/:id/view", async (req, res) => {
  try {
    const postId = req.params.id;
    const { rows } = await pool.query(
      "UPDATE posts SET views = views + 1 WHERE id = $1 RETURNING *",
      [postId]
    );
    const post = rows[0];
    const io = req.app.get("io");
    if (io) io.emit("view_update", { postId, views: post?.views });

    if (post?.user_id) {
      const { rows: userRows } = await pool.query("SELECT wallet_balance FROM users WHERE id = $1", [post.user_id]);
      if (userRows[0] && io) {
        io.emit("wallet_update", { userId: post.user_id, wallet_balance: parseFloat(userRows[0].wallet_balance) });
      }
    }
    res.json({ success: true, views: post?.views });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/tips", async (req, res) => {
  try {
    const { creator_id, supporter_id, amount } = req.body;
    const { rows } = await pool.query(
      "INSERT INTO tips (creator_id, supporter_id, amount, status) VALUES ($1,$2,$3,'completed') RETURNING *",
      [creator_id, supporter_id || null, amount]
    );

    await pool.query(
      "INSERT INTO earnings (user_id, type, amount) VALUES ($1, 'tip', $2)",
      [creator_id, amount]
    );

    await pool.query(
      "UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2",
      [parseFloat(amount) * 0.7, creator_id]
    );

    const { rows: userRows } = await pool.query("SELECT wallet_balance FROM users WHERE id = $1", [creator_id]);
    const io = req.app.get("io");
    if (io) {
      io.emit("tip_received", { creatorId: creator_id, amount, tip: rows[0] });
      if (userRows[0]) {
        io.emit("wallet_update", { userId: creator_id, wallet_balance: parseFloat(userRows[0].wallet_balance) });
      }
    }
    res.json(rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/wallet/:userId", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT id, email, display_name, role, wallet_balance, payout_email, created_at FROM users WHERE id = $1", [req.params.userId]);
    if (rows.length === 0) { res.status(404).json({ error: "User not found" }); return; }

    const { rows: earningsRows } = await pool.query(
      "SELECT type, SUM(amount) as total, COUNT(*) as count FROM earnings WHERE user_id = $1 GROUP BY type",
      [req.params.userId]
    );

    const { rows: postStats } = await pool.query(
      "SELECT COALESCE(SUM(views),0) as total_views, COALESCE(SUM(likes),0) as total_likes FROM posts WHERE user_id = $1",
      [req.params.userId]
    );

    res.json({
      user: rows[0],
      earnings: earningsRows,
      stats: postStats[0]
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/admin-config", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM admin_config WHERE id = 'platform'");
    res.json(rows[0] || null);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put("/admin-config", async (req, res) => {
  try {
    const { monetization, ad_slots, featured_show_ids, categories } = req.body;
    const { rows } = await pool.query(
      "INSERT INTO admin_config (id, monetization, ad_slots, featured_show_ids, categories, updated_at) VALUES ('platform',$1,$2,$3,$4,NOW()) ON CONFLICT (id) DO UPDATE SET monetization=$1, ad_slots=$2, featured_show_ids=$3, categories=$4, updated_at=NOW() RETURNING *",
      [JSON.stringify(monetization), JSON.stringify(ad_slots), JSON.stringify(featured_show_ids), JSON.stringify(categories)]
    );
    res.json(rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
