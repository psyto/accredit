/* ------------------------------------------------------------------ */
/*  ZK compliance proof — input preparation & constraint checking      */
/* ------------------------------------------------------------------ */

export interface WitnessInputs {
  kycLevel: string;
  jurisdiction: string;
  expiryTimestamp: string;
  minKycLevel: string;
  jurisdictionBitmask: string;
  currentTimestamp: string;
  meetsRequirements: boolean;
}

/**
 * Prepare witness inputs for a Noir ZK circuit that proves KYC
 * compliance without revealing the underlying data.
 *
 * All numeric fields are serialised as decimal strings (BigInt-safe).
 */
export function generateComplianceProofInputs(
  kycLevel: number,
  jurisdiction: number,
  expiryTimestamp: number,
  minKycLevel: number,
  jurisdictionBitmask: number,
): WitnessInputs {
  const now = Math.floor(Date.now() / 1000);

  const levelMet = kycLevel >= minKycLevel;
  const jurisdictionBit = 1 << jurisdiction;
  const jurisdictionAllowed = (jurisdictionBitmask & jurisdictionBit) !== 0;
  const notExpired = expiryTimestamp === 0 || expiryTimestamp > now;

  return {
    kycLevel: kycLevel.toString(),
    jurisdiction: jurisdiction.toString(),
    expiryTimestamp: expiryTimestamp.toString(),
    minKycLevel: minKycLevel.toString(),
    jurisdictionBitmask: jurisdictionBitmask.toString(),
    currentTimestamp: now.toString(),
    meetsRequirements: levelMet && jurisdictionAllowed && notExpired,
  };
}

export interface VerificationResult {
  valid: boolean;
  checks: {
    levelMet: boolean;
    jurisdictionAllowed: boolean;
    notExpired: boolean;
  };
}

/**
 * Stateless verification that inputs satisfy the ZK circuit constraints
 * (without actually generating/verifying a ZK proof).
 */
export function verifyComplianceInputs(
  kycLevel: number,
  jurisdiction: number,
  expiryTimestamp: number,
  minKycLevel: number,
  jurisdictionBitmask: number,
  currentTimestamp?: number,
): VerificationResult {
  const now = currentTimestamp ?? Math.floor(Date.now() / 1000);

  const levelMet = kycLevel >= minKycLevel;
  const jurisdictionBit = 1 << jurisdiction;
  const jurisdictionAllowed = (jurisdictionBitmask & jurisdictionBit) !== 0;
  const notExpired = expiryTimestamp === 0 || expiryTimestamp > now;

  return {
    valid: levelMet && jurisdictionAllowed && notExpired,
    checks: {
      levelMet,
      jurisdictionAllowed,
      notExpired,
    },
  };
}
