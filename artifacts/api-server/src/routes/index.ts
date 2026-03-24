import { Router, type IRouter } from "express";
import healthRouter from "./health";
import abilityStreamRouter from "./ability-stream";
import authRouter from "./auth";
import uploadRouter from "./upload";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/ability-stream", abilityStreamRouter);
router.use("/auth", authRouter);
router.use("/upload", uploadRouter);

export default router;
