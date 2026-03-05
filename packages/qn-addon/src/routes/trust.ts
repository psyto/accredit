import { Router, Request, Response } from 'express';
import {
  assessTrust,
  compareTrust,
  scoreToDimension,
  meetsThreshold,
  Dimension,
} from '../services/trust-service';
import { SovereignScores } from '../services/identity-service';

const router = Router();

const VALID_DIMENSIONS: Dimension[] = ['trading', 'civic', 'developer', 'infra', 'creator'];

function isValidScores(scores: any): scores is SovereignScores {
  if (!scores || typeof scores !== 'object') return false;
  for (const dim of VALID_DIMENSIONS) {
    if (typeof scores[dim] !== 'number' || scores[dim] < 0 || scores[dim] > 10000) {
      return false;
    }
  }
  return true;
}

/**
 * POST /v1/trust/assess
 * Stateless trust assessment from SOVEREIGN scores.
 * Body: { scores: { trading, civic, developer, infra, creator }, dimension? }
 */
router.post('/v1/trust/assess', (req: Request, res: Response) => {
  try {
    const { scores, dimension } = req.body;

    if (!isValidScores(scores)) {
      res.status(400).json({
        success: false,
        error: 'scores must include trading, civic, developer, infra, creator as numbers (0-10000)',
      });
      return;
    }

    if (dimension !== undefined && !VALID_DIMENSIONS.includes(dimension)) {
      res.status(400).json({
        success: false,
        error: `Invalid dimension "${dimension}". Must be one of: ${VALID_DIMENSIONS.join(', ')}`,
      });
      return;
    }

    const assessment = assessTrust(scores, dimension);

    res.json({
      success: true,
      data: assessment,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /v1/trust/compare
 * Compare trust profiles of two wallets.
 * Body: { scoresA: {...}, scoresB: {...} }
 */
router.post('/v1/trust/compare', (req: Request, res: Response) => {
  try {
    const { scoresA, scoresB } = req.body;

    if (!isValidScores(scoresA)) {
      res.status(400).json({
        success: false,
        error: 'scoresA must include trading, civic, developer, infra, creator as numbers (0-10000)',
      });
      return;
    }

    if (!isValidScores(scoresB)) {
      res.status(400).json({
        success: false,
        error: 'scoresB must include trading, civic, developer, infra, creator as numbers (0-10000)',
      });
      return;
    }

    const comparison = compareTrust(scoresA, scoresB);

    res.json({
      success: true,
      data: comparison,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /v1/trust/threshold
 * Check whether scores meet a minimum threshold for a dimension.
 * Body: { scores: {...}, dimension: string, minScore: number }
 */
router.post('/v1/trust/threshold', (req: Request, res: Response) => {
  try {
    const { scores, dimension, minScore } = req.body;

    if (!isValidScores(scores)) {
      res.status(400).json({
        success: false,
        error: 'scores must include trading, civic, developer, infra, creator as numbers (0-10000)',
      });
      return;
    }

    if (!VALID_DIMENSIONS.includes(dimension)) {
      res.status(400).json({
        success: false,
        error: `Invalid dimension "${dimension}". Must be one of: ${VALID_DIMENSIONS.join(', ')}`,
      });
      return;
    }

    if (typeof minScore !== 'number' || minScore < 0 || minScore > 10000) {
      res.status(400).json({
        success: false,
        error: 'minScore must be a number between 0 and 10000',
      });
      return;
    }

    const meets = meetsThreshold(scores, dimension, minScore);

    res.json({
      success: true,
      data: {
        meets,
        dimension,
        actualScore: scores[dimension as Dimension],
        requiredScore: minScore,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /v1/trust/profile
 * Analyze a score profile: strongest, weakest, dimensions sorted by score.
 * Body: { scores: {...} }
 */
router.post('/v1/trust/profile', (req: Request, res: Response) => {
  try {
    const { scores } = req.body;

    if (!isValidScores(scores)) {
      res.status(400).json({
        success: false,
        error: 'scores must include trading, civic, developer, infra, creator as numbers (0-10000)',
      });
      return;
    }

    const profile = scoreToDimension(scores);

    res.json({
      success: true,
      data: profile,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
