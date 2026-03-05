import { Router, Request, Response } from "express";

const router = Router();

router.get("/healthcheck", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "accredit-kyc-gateway" });
});

export default router;
