import { PublicKey } from '@solana/web3.js';
import type { KycLevel, Jurisdiction } from './kyc';

/** Pool compliance status */
export enum PoolStatus {
  Active = 0,
  Suspended = 1,
  Revoked = 2,
}

/** On-chain PoolComplianceEntry deserialized */
export interface PoolComplianceEntry {
  ammKey: PublicKey;
  registry: PublicKey;
  operator: PublicKey;
  dexLabel: string;
  status: PoolStatus;
  jurisdiction: Jurisdiction;
  kycLevel: KycLevel;
  auditHash: Uint8Array;
  auditExpiry: number;
  registeredAt: number;
  updatedAt: number;
}

/** Compliant quote result wrapping Jupiter QuoteResponse */
export interface CompliantQuoteResult {
  /** Original Jupiter quote (filtered to compliant route) */
  quote: QuoteResponse;
  /** Whether the original route was fully compliant or was re-fetched */
  wasFiltered: boolean;
  /** Number of compliant hops in the route */
  compliantHopCount: number;
  /** Trader's KYC level */
  traderKycLevel: KycLevel;
  /** Trader's jurisdiction */
  traderJurisdiction: Jurisdiction;
}

/** Compliance check result for a single route */
export interface RouteComplianceResult {
  isCompliant: boolean;
  /** AMM keys that are NOT in the whitelist */
  nonCompliantPools: string[];
  /** AMM keys that passed compliance */
  compliantPools: string[];
}

/** Configuration for ComplianceAwareRouter */
export interface ComplianceRouterConfig {
  /** RPC connection URL */
  rpcUrl?: string;
  /** Compliant registry program ID */
  registryProgramId?: PublicKey;
  /** Transfer-hook program ID for KYC lookups */
  transferHookProgramId?: PublicKey;
  /** Jupiter API base URL */
  jupiterApiBaseUrl?: string;
  /** Default slippage in basis points */
  defaultSlippageBps?: number;
  /** Whether to fall back to direct routes when multi-hop fails compliance */
  fallbackToDirectRoutes?: boolean;
  /** Maximum route hops to consider */
  maxRouteHops?: number;
}

/** On-chain ComplianceConfig deserialized */
export interface ComplianceConfig {
  authority: PublicKey;
  poolRegistry: PublicKey;
  kycRegistry: PublicKey;
  jurisdictionBitmask: number;
  basicTradeLimit: bigint;
  standardTradeLimit: bigint;
  enhancedTradeLimit: bigint;
  zkVerifierKey: PublicKey;
  isActive: boolean;
  maxRouteHops: number;
  createdAt: bigint;
  updatedAt: bigint;
  bump: number;
}

/** ZK compliance proof for privacy-preserving KYC verification */
export interface ZkComplianceProof {
  proof: Uint8Array;
  publicInputs: Uint8Array[];
  circuitId: string;
  kycLevelCommitment: Uint8Array;
  jurisdictionCommitment: Uint8Array;
}

/** Jupiter aggregator configuration */
export interface AggregatorConfig {
  /** Jupiter API base URL */
  apiBaseUrl?: string;
  /** Default slippage in basis points (e.g., 50 = 0.5%) */
  defaultSlippageBps?: number;
  /** Maximum number of routes to consider */
  maxRoutes?: number;
  /** Request timeout in milliseconds */
  timeoutMs?: number;
}

export interface QuoteRequest {
  inputMint: PublicKey | string;
  outputMint: PublicKey | string;
  amount: string;
  slippageBps?: number;
  onlyDirectRoutes?: boolean;
  maxAccounts?: number;
}

export interface QuoteResponse {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: RoutePlanStep[];
  contextSlot: number;
  timeTaken: number;
}

export interface RoutePlanStep {
  swapInfo: SwapInfo;
  percent: number;
}

export interface SwapInfo {
  ammKey: string;
  label: string;
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  feeAmount: string;
  feeMint: string;
}

export interface SwapRoute {
  quote: QuoteResponse;
  steps: RouteStep[];
  totalFee: string;
  priceImpact: number;
  effectivePrice: number;
}

export interface RouteStep {
  dex: string;
  inputMint: string;
  outputMint: string;
  inputAmount: string;
  outputAmount: string;
  fee: string;
}

export interface SwapParams {
  quoteResponse: QuoteResponse;
  userPublicKey: PublicKey | string;
  wrapAndUnwrapSol?: boolean;
  dynamicComputeUnitLimit?: boolean;
  prioritizationFeeLamports?: number | 'auto';
}

export interface SwapResponse {
  swapTransaction: string;
  lastValidBlockHeight: number;
  prioritizationFeeLamports: number;
}
