import { Router } from "express";
import { complaintController } from "../controllers/complaint.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", authMiddleware, complaintController.list);
router.post("/", authMiddleware, complaintController.create);

export default router;
