import { Router } from "express";
import { prisma } from "../utils/prisma";

const router = Router();

router.get("/", async (_req, res) => {
  const cities = await prisma.city.findMany({
    where: { isActive: true },
  });

  res.json(cities);
});

export default router;
