import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } });

const router = Router();

router.post("/", upload.single("file"), (req, res) => {
  if (!req.file) { res.status(400).json({ error: "No file uploaded" }); return; }
  const publicUrl = `/api/uploads/${req.file.filename}`;
  res.json({ url: publicUrl, filename: req.file.filename });
});

export default router;
