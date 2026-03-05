/* ------------------------------------------------------------------ */
/*  Route compliance — stateless pool whitelist checking               */
/* ------------------------------------------------------------------ */

const whitelistedPools: Set<string> = new Set();

export interface RoutePlan {
  ammKey: string;
  [key: string]: unknown;
}

export interface RouteCheckResult {
  isCompliant: boolean;
  compliantPools: string[];
  nonCompliantPools: string[];
}

/**
 * Check if all hops in a route plan use whitelisted AMM pools.
 */
export function checkRoute(routePlan: RoutePlan[]): RouteCheckResult {
  const compliantPools: string[] = [];
  const nonCompliantPools: string[] = [];

  for (const hop of routePlan) {
    if (whitelistedPools.has(hop.ammKey)) {
      compliantPools.push(hop.ammKey);
    } else {
      nonCompliantPools.push(hop.ammKey);
    }
  }

  return {
    isCompliant: nonCompliantPools.length === 0 && compliantPools.length > 0,
    compliantPools,
    nonCompliantPools,
  };
}

/**
 * Batch check pool keys against the whitelist.
 */
export function checkPools(ammKeys: string[]): Map<string, boolean> {
  const results = new Map<string, boolean>();
  for (const key of ammKeys) {
    results.set(key, whitelistedPools.has(key));
  }
  return results;
}

/**
 * Add a pool to the whitelist.
 */
export function addToWhitelist(ammKey: string): void {
  whitelistedPools.add(ammKey);
}

/**
 * Remove a pool from the whitelist.
 */
export function removeFromWhitelist(ammKey: string): boolean {
  return whitelistedPools.delete(ammKey);
}

/**
 * Get all whitelisted pools.
 */
export function getWhitelist(): string[] {
  return Array.from(whitelistedPools);
}
