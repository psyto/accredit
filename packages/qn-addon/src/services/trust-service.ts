import { SovereignScores } from './identity-service';

export type Dimension = 'trading' | 'civic' | 'developer' | 'infra' | 'creator';

const ALL_DIMENSIONS: Dimension[] = ['trading', 'civic', 'developer', 'infra', 'creator'];

export interface TrustAssessment {
  level: string;     // 'untrusted' | 'low' | 'medium' | 'high' | 'very-high'
  score: number;     // the score used for assessment (0-10000)
  dimension: string; // 'overall' or the specific dimension
  reasoning: string;
}

export interface TrustComparison {
  walletA: { scores: SovereignScores; composite: number };
  walletB: { scores: SovereignScores; composite: number };
  stronger: 'A' | 'B' | 'equal';
  dimensionComparison: Record<Dimension, { a: number; b: number; winner: 'A' | 'B' | 'equal' }>;
}

export interface TrustProfile {
  strongest: { dimension: Dimension; score: number };
  weakest: { dimension: Dimension; score: number };
  dimensions: Array<{ dimension: Dimension; score: number }>;
  averageScore: number;
}

/**
 * Map a score (0-10000 basis points) to a trust level.
 */
function scoreToLevel(score: number): string {
  if (score >= 8000) return 'very-high';
  if (score >= 6000) return 'high';
  if (score >= 4000) return 'medium';
  if (score >= 2000) return 'low';
  return 'untrusted';
}

/**
 * Compute the composite score as a simple average of all dimensions.
 */
function computeComposite(scores: SovereignScores): number {
  const sum = scores.trading + scores.civic + scores.developer + scores.infra + scores.creator;
  return Math.round(sum / 5);
}

/**
 * Assess trust for a given set of SOVEREIGN scores.
 * If a specific dimension is provided, assess that dimension only.
 * Otherwise, assess overall (composite).
 */
export function assessTrust(scores: SovereignScores, dimension?: Dimension): TrustAssessment {
  if (dimension) {
    const score = scores[dimension];
    const level = scoreToLevel(score);
    return {
      level,
      score,
      dimension,
      reasoning: `${dimension} score of ${score}/10000 indicates ${level} trust in this dimension.`,
    };
  }

  const composite = computeComposite(scores);
  const level = scoreToLevel(composite);
  return {
    level,
    score: composite,
    dimension: 'overall',
    reasoning: `Composite score of ${composite}/10000 across all dimensions indicates ${level} overall trust.`,
  };
}

/**
 * Compare trust profiles of two wallets.
 */
export function compareTrust(scoresA: SovereignScores, scoresB: SovereignScores): TrustComparison {
  const compositeA = computeComposite(scoresA);
  const compositeB = computeComposite(scoresB);

  const dimensionComparison = {} as Record<Dimension, { a: number; b: number; winner: 'A' | 'B' | 'equal' }>;
  for (const dim of ALL_DIMENSIONS) {
    const a = scoresA[dim];
    const b = scoresB[dim];
    dimensionComparison[dim] = {
      a,
      b,
      winner: a > b ? 'A' : b > a ? 'B' : 'equal',
    };
  }

  return {
    walletA: { scores: scoresA, composite: compositeA },
    walletB: { scores: scoresB, composite: compositeB },
    stronger: compositeA > compositeB ? 'A' : compositeB > compositeA ? 'B' : 'equal',
    dimensionComparison,
  };
}

/**
 * Analyze a score profile to find the strongest and weakest dimensions.
 */
export function scoreToDimension(scores: SovereignScores): TrustProfile {
  const entries: Array<{ dimension: Dimension; score: number }> = ALL_DIMENSIONS.map((dim) => ({
    dimension: dim,
    score: scores[dim],
  }));

  // Sort descending by score
  entries.sort((a, b) => b.score - a.score);

  const sum = entries.reduce((acc, e) => acc + e.score, 0);
  const averageScore = Math.round(sum / entries.length);

  return {
    strongest: entries[0],
    weakest: entries[entries.length - 1],
    dimensions: entries,
    averageScore,
  };
}

/**
 * Check whether scores meet a minimum threshold for a given dimension.
 */
export function meetsThreshold(scores: SovereignScores, dimension: Dimension, minScore: number): boolean {
  return scores[dimension] >= minScore;
}
