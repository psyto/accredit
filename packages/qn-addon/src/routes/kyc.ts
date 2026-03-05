import { Router, Request, Response } from "express";
import { Connection } from "@solana/web3.js";
import { instanceLookup } from "../middleware/instance-lookup";
import {
  readWhitelistEntry,
  checkCompliance,
  batchCheckCompliance,
} from "../services/kyc-service";

const router = Router();

/**
 * Build a Connection from the provisioned instance's RPC URL.
 */
function getConnection(req: Request): Connection {
  const httpUrl = req.instance!.http_url;
  return new Connection(httpUrl, "confirmed");
}

/* ------------------------------------------------------------------ */
/*  GET /v1/kyc/:wallet — read whitelist entry                         */
/* ------------------------------------------------------------------ */
router.get(
  "/v1/kyc/:wallet",
  instanceLookup,
  async (req: Request, res: Response) => {
    try {
      const { wallet } = req.params;

      if (!wallet) {
        res.status(400).json({ error: "Missing wallet parameter" });
        return;
      }

      const connection = getConnection(req);
      const entry = await readWhitelistEntry(connection, wallet as string);

      if (!entry) {
        res.status(404).json({ error: "No KYC entry found for wallet" });
        return;
      }

      res.json({ status: "ok", entry });
    } catch (err: any) {
      console.error("[kyc/:wallet] error:", err.message);
      res.status(500).json({ error: "Failed to read KYC entry" });
    }
  },
);

/* ------------------------------------------------------------------ */
/*  POST /v1/kyc/check — single compliance check                      */
/* ------------------------------------------------------------------ */
router.post(
  "/v1/kyc/check",
  instanceLookup,
  async (req: Request, res: Response) => {
    try {
      const { wallet, minKycLevel, jurisdictionBitmask } = req.body;

      if (!wallet) {
        res.status(400).json({ error: "Missing wallet in request body" });
        return;
      }

      const connection = getConnection(req);
      const result = await checkCompliance(
        connection,
        wallet,
        minKycLevel ?? 1,
        jurisdictionBitmask,
      );

      res.json({ status: "ok", ...result });
    } catch (err: any) {
      console.error("[kyc/check] error:", err.message);
      res.status(500).json({ error: "Compliance check failed" });
    }
  },
);

/* ------------------------------------------------------------------ */
/*  POST /v1/kyc/batch — batch compliance check (max 100)             */
/* ------------------------------------------------------------------ */
router.post(
  "/v1/kyc/batch",
  instanceLookup,
  async (req: Request, res: Response) => {
    try {
      const { wallets, minKycLevel, jurisdictionBitmask } = req.body;

      if (!Array.isArray(wallets) || wallets.length === 0) {
        res.status(400).json({ error: "wallets must be a non-empty array" });
        return;
      }

      if (wallets.length > 100) {
        res
          .status(400)
          .json({ error: "Batch size cannot exceed 100 wallets" });
        return;
      }

      const connection = getConnection(req);
      const results = await batchCheckCompliance(
        connection,
        wallets,
        minKycLevel ?? 1,
        jurisdictionBitmask,
      );

      res.json({ status: "ok", results });
    } catch (err: any) {
      console.error("[kyc/batch] error:", err.message);
      res.status(500).json({ error: "Batch compliance check failed" });
    }
  },
);

export default router;
