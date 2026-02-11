import { PublicKey } from '@solana/web3.js';

// PDA seed constants matching on-chain program seeds
const SEEDS = {
  kycRegistry: Buffer.from('kyc_registry'),
  whitelist: Buffer.from('whitelist'),
  extraAccountMetas: Buffer.from('extra-account-metas'),
  poolRegistry: Buffer.from('pool_registry'),
  poolEntry: Buffer.from('pool_entry'),
  complianceConfig: Buffer.from('compliance_config'),
} as const;

// ============================================================================
// Transfer Hook PDAs (CORE)
// ============================================================================

/** Derive PDA for KycRegistry account */
export function findKycRegistryPda(
  mint: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.kycRegistry, mint.toBuffer()],
    programId
  );
}

/** Derive PDA for WhitelistEntry account (unified: seeds = [whitelist, wallet]) */
export function findWhitelistEntryPda(
  wallet: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.whitelist, wallet.toBuffer()],
    programId
  );
}

/** Derive PDA for extra account metas list (transfer hook resolution) */
export function findExtraAccountMetaListPda(
  mint: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.extraAccountMetas, mint.toBuffer()],
    programId
  );
}

// ============================================================================
// Compliant Registry PDAs (ROUTING)
// ============================================================================

/** Derive PDA for CompliantPoolRegistry account */
export function findPoolRegistryPda(
  authority: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.poolRegistry, authority.toBuffer()],
    programId
  );
}

/** Derive PDA for PoolComplianceEntry account */
export function findPoolEntryPda(
  registry: PublicKey,
  ammKey: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.poolEntry, registry.toBuffer(), ammKey.toBuffer()],
    programId
  );
}

/** Derive PDA for ComplianceConfig account */
export function findComplianceConfigPda(
  authority: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.complianceConfig, authority.toBuffer()],
    programId
  );
}

export { SEEDS as PDA_SEEDS };
