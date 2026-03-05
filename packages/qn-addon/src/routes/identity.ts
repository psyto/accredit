import { Router, Request, Response } from 'express';
import { Connection } from '@solana/web3.js';
import { instanceLookup } from '../middleware/instance-lookup';
import { readIdentity, batchReadIdentities } from '../services/identity-service';

const router = Router();

const VALID_DIMENSIONS = ['trading', 'civic', 'developer', 'infra', 'creator'];

/**
 * GET /v1/identity/:wallet
 * Read a single wallet's SOVEREIGN identity scores, tier, tierName, and confidence.
 * Requires X-INSTANCE-ID header (provisioned RPC endpoint).
 */
router.get('/v1/identity/:wallet', instanceLookup, async (req: Request, res: Response) => {
  try {
    const { wallet } = req.params;
    if (!wallet) {
      res.status(400).json({ success: false, error: 'Missing wallet parameter' });
      return;
    }

    const rpcUrl = req.instance!.http_url;
    if (!rpcUrl) {
      res.status(400).json({ success: false, error: 'No RPC endpoint configured for this instance' });
      return;
    }

    const connection = new Connection(rpcUrl as string);
    const identity = await readIdentity(connection, wallet as string);

    if (!identity) {
      res.status(404).json({ success: false, error: 'Identity not found for this wallet' });
      return;
    }

    res.json({
      success: true,
      data: identity,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /v1/identity/batch
 * Batch-read SOVEREIGN identities for up to 100 wallets.
 * Body: { wallets: string[] }
 * Requires X-INSTANCE-ID header (provisioned RPC endpoint).
 */
router.post('/v1/identity/batch', instanceLookup, async (req: Request, res: Response) => {
  try {
    const { wallets } = req.body;

    if (!Array.isArray(wallets) || wallets.length === 0) {
      res.status(400).json({ success: false, error: 'wallets must be a non-empty array of base58 strings' });
      return;
    }

    if (wallets.length > 100) {
      res.status(400).json({ success: false, error: 'Maximum 100 wallets per batch request' });
      return;
    }

    const rpcUrl = req.instance!.http_url;
    if (!rpcUrl) {
      res.status(400).json({ success: false, error: 'No RPC endpoint configured for this instance' });
      return;
    }

    const connection = new Connection(rpcUrl);
    const results = await batchReadIdentities(connection, wallets);

    // Convert Map to plain object for JSON serialization
    const data: Record<string, any> = {};
    for (const [key, value] of results) {
      data[key] = value;
    }

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /v1/identity/:wallet/dimension/:dimension
 * Read a single dimension score for a wallet.
 * Requires X-INSTANCE-ID header (provisioned RPC endpoint).
 */
router.get('/v1/identity/:wallet/dimension/:dimension', instanceLookup, async (req: Request, res: Response) => {
  try {
    const { wallet, dimension } = req.params;

    if (!wallet) {
      res.status(400).json({ success: false, error: 'Missing wallet parameter' });
      return;
    }

    if (!VALID_DIMENSIONS.includes(dimension as string)) {
      res.status(400).json({
        success: false,
        error: `Invalid dimension "${dimension}". Must be one of: ${VALID_DIMENSIONS.join(', ')}`,
      });
      return;
    }

    const rpcUrl = req.instance!.http_url;
    if (!rpcUrl) {
      res.status(400).json({ success: false, error: 'No RPC endpoint configured for this instance' });
      return;
    }

    const connection = new Connection(rpcUrl as string);
    const identity = await readIdentity(connection, wallet as string);

    if (!identity) {
      res.status(404).json({ success: false, error: 'Identity not found for this wallet' });
      return;
    }

    const score = identity.scores[dimension as keyof typeof identity.scores];

    res.json({
      success: true,
      data: {
        wallet: identity.owner,
        dimension,
        score,
        tier: identity.tier,
        tierName: identity.tierName,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
