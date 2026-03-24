import express, { type Express } from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import router from "./routes";

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/api/uploads", express.static(uploadsDir));

app.use("/api", router);

const possiblePaths = [
  path.resolve(process.cwd(), "artifacts/ability-stream/dist/public"),
  path.resolve(process.cwd(), "dist/public"),
];
const frontendDist = possiblePaths.find(p => fs.existsSync(p));
if (frontendDist) {
  console.log("Serving frontend from:", frontendDist);
  app.use(express.static(frontendDist));
  app.get("{*path}", (_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
} else {
  console.log("No frontend dist found, checked:", possiblePaths);
}

export default app;
