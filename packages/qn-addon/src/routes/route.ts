import { Router, Request, Response } from "express";
import {
  checkRoute,
  checkPools,
  addToWhitelist,
  removeFromWhitelist,
} from "../services/route-service";

const router = Router();

/* ------------------------------------------------------------------ */
/*  POST /v1/route/check — check route plan compliance                 */
/* ------------------------------------------------------------------ */
router.post("/v1/route/check", (req: Request, res: Response) => {
  try {
    const { routePlan } = req.body;

    if (!Array.isArray(routePlan) || routePlan.length === 0) {
      res
        .status(400)
        .json({ error: "routePlan must be a non-empty array of hops" });
      return;
    }

    for (const hop of routePlan) {
      if (!hop.ammKey || typeof hop.ammKey !== "string") {
        res
          .status(400)
          .json({ error: "Each hop must have a string ammKey" });
        return;
      }
    }

    const result = checkRoute(routePlan);
    res.json({ status: "ok", ...result });
  } catch (err: any) {
    console.error("[route/check] error:", err.message);
    res.status(500).json({ error: "Route check failed" });
  }
});

/* ------------------------------------------------------------------ */
/*  POST /v1/route/pools — batch check pool keys                      */
/* ------------------------------------------------------------------ */
router.post("/v1/route/pools", (req: Request, res: Response) => {
  try {
    const { ammKeys } = req.body;

    if (!Array.isArray(ammKeys) || ammKeys.length === 0) {
      res
        .status(400)
        .json({ error: "ammKeys must be a non-empty array" });
      return;
    }

    const results = checkPools(ammKeys);
    const poolStatus: Record<string, boolean> = {};
    results.forEach((v, k) => {
      poolStatus[k] = v;
    });

    res.json({ status: "ok", pools: poolStatus });
  } catch (err: any) {
    console.error("[route/pools] error:", err.message);
    res.status(500).json({ error: "Pool check failed" });
  }
});

/* ------------------------------------------------------------------ */
/*  POST /v1/route/whitelist/add — add pool to whitelist               */
/* ------------------------------------------------------------------ */
router.post("/v1/route/whitelist/add", (req: Request, res: Response) => {
  try {
    const { ammKey } = req.body;

    if (!ammKey || typeof ammKey !== "string") {
      res.status(400).json({ error: "ammKey is required" });
      return;
    }

    addToWhitelist(ammKey);
    res.json({ status: "ok", success: true });
  } catch (err: any) {
    console.error("[route/whitelist/add] error:", err.message);
    res.status(500).json({ error: "Failed to add to whitelist" });
  }
});

/* ------------------------------------------------------------------ */
/*  DELETE /v1/route/whitelist/:ammKey — remove pool from whitelist     */
/* ------------------------------------------------------------------ */
router.delete(
  "/v1/route/whitelist/:ammKey",
  (req: Request, res: Response) => {
    try {
      const { ammKey } = req.params;

      if (!ammKey) {
        res.status(400).json({ error: "ammKey parameter is required" });
        return;
      }

      removeFromWhitelist(ammKey as string);
      res.json({ status: "ok", success: true });
    } catch (err: any) {
      console.error("[route/whitelist/remove] error:", err.message);
      res.status(500).json({ error: "Failed to remove from whitelist" });
    }
  },
);

export default router;
