import { Router } from "express";
import { partnerController } from "../controllers/partner.controller";

const router = Router();

router.get("/", partnerController.list);
router.get("/clinics", partnerController.getClinics);
router.post("/seed", partnerController.seed);

export default router;
