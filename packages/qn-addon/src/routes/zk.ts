import { Router, Request, Response } from "express";
import {
  generateComplianceProofInputs,
  verifyComplianceInputs,
} from "../services/zk-service";

const router = Router();

/* ------------------------------------------------------------------ */
/*  POST /v1/zk/prepare — generate witness inputs for Noir circuit     */
/* ------------------------------------------------------------------ */
router.post("/v1/zk/prepare", (req: Request, res: Response) => {
  try {
    const {
      kycLevel,
      jurisdiction,
      expiryTimestamp,
      minKycLevel,
      jurisdictionBitmask,
    } = req.body;

    if (
      kycLevel === undefined ||
      jurisdiction === undefined ||
      expiryTimestamp === undefined ||
      minKycLevel === undefined ||
      jurisdictionBitmask === undefined
    ) {
      res.status(400).json({
        error:
          "Required fields: kycLevel, jurisdiction, expiryTimestamp, minKycLevel, jurisdictionBitmask",
      });
      return;
    }

    const witness = generateComplianceProofInputs(
      Number(kycLevel),
      Number(jurisdiction),
      Number(expiryTimestamp),
      Number(minKycLevel),
      Number(jurisdictionBitmask),
    );

    res.json({ status: "ok", witness });
  } catch (err: any) {
    console.error("[zk/prepare] error:", err.message);
    res.status(500).json({ error: "Failed to generate witness inputs" });
  }
});

/* ------------------------------------------------------------------ */
/*  POST /v1/zk/verify-inputs — stateless constraint verification      */
/* ------------------------------------------------------------------ */
router.post("/v1/zk/verify-inputs", (req: Request, res: Response) => {
  try {
    const {
      kycLevel,
      jurisdiction,
      expiryTimestamp,
      minKycLevel,
      jurisdictionBitmask,
      currentTimestamp,
    } = req.body;

    if (
      kycLevel === undefined ||
      jurisdiction === undefined ||
      expiryTimestamp === undefined ||
      minKycLevel === undefined ||
      jurisdictionBitmask === undefined
    ) {
      res.status(400).json({
        error:
          "Required fields: kycLevel, jurisdiction, expiryTimestamp, minKycLevel, jurisdictionBitmask",
      });
      return;
    }

    const result = verifyComplianceInputs(
      Number(kycLevel),
      Number(jurisdiction),
      Number(expiryTimestamp),
      Number(minKycLevel),
      Number(jurisdictionBitmask),
      currentTimestamp !== undefined ? Number(currentTimestamp) : undefined,
    );

    res.json({ status: "ok", ...result });
  } catch (err: any) {
    console.error("[zk/verify-inputs] error:", err.message);
    res.status(500).json({ error: "Failed to verify inputs" });
  }
});

export default router;
