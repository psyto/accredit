# Architecture

## Layered Design

Accredit separates concerns into two layers that consumers import independently:

```
┌─────────────────────────────────────────────────────────────┐
│  ROUTING LAYER (institutional DEX access)                   │
│                                                             │
│  compliant-registry program                                 │
│    └─ Pool whitelist, audit tracking, route verification    │
│                                                             │
│  @accredit/router                                           │
│    └─ ComplianceAwareRouter → Jupiter → route filtering     │
├─────────────────────────────────────────────────────────────┤
│  CORE LAYER (KYC/AML transfer enforcement)                  │
│                                                             │
│  transfer-hook program                                      │
│    └─ Token-2022 hook: whitelist check on every transfer    │
│                                                             │
│  accredit-types crate                                       │
│    └─ KycLevel, Jurisdiction, validation helpers            │
│                                                             │
│  @accredit/types + @accredit/sdk                            │
│    └─ TypeScript types, PDA derivation, KycClient           │
└─────────────────────────────────────────────────────────────┘
```

Consumer projects choose their layer:

- **Core only** — Basic KYC-gated token transfers. Import `accredit-types` (Rust) and `@accredit/types` + `@accredit/sdk` (TypeScript).
- **Core + Routing** — Full compliant DEX routing. Additionally import the `compliant-registry` program and `@accredit/router`.

## On-Chain Account Structure

### Transfer Hook Program

```
KycRegistry (per mint)
  PDA: ["kyc_registry", mint]
  ├── authority: Pubkey
  ├── mint: Pubkey
  ├── whitelist_count: u64
  ├── is_active: bool
  ├── require_kyc: bool
  ├── verified_only: bool
  ├── created_at: i64
  ├── updated_at: i64
  └── bump: u8

WhitelistEntry (per wallet)
  PDA: ["whitelist", wallet]
  ├── wallet: Pubkey
  ├── registry: Pubkey
  ├── kyc_level: KycLevel
  ├── jurisdiction: Jurisdiction
  ├── kyc_hash: [u8; 32]
  ├── is_active: bool
  ├── daily_limit: u64        (0 = use per-level default)
  ├── daily_volume: u64
  ├── volume_reset_time: i64
  ├── verified_at: i64
  ├── expiry_timestamp: i64   (0 = never expires)
  ├── last_activity: i64
  ├── created_at: i64
  └── bump: u8

ExtraAccountMetaList (per mint)
  PDA: ["extra-account-metas", mint]
  └── Resolves KycRegistry + sender/recipient WhitelistEntry for Token-2022
```

### Compliant Registry Program

```
CompliantPoolRegistry (per authority)
  PDA: ["pool_registry", authority]
  ├── authority: Pubkey
  ├── pool_count: u32
  ├── min_kyc_level: KycLevel
  ├── is_active: bool
  ├── created_at: i64
  ├── updated_at: i64
  └── bump: u8

PoolComplianceEntry (per pool)
  PDA: ["pool_entry", registry, amm_key]
  ├── amm_key: Pubkey           (Jupiter AMM key)
  ├── registry: Pubkey
  ├── operator: Pubkey
  ├── dex_label: String         (max 32 chars)
  ├── status: PoolStatus        (Active | Suspended | Revoked)
  ├── jurisdiction: Jurisdiction
  ├── kyc_level: KycLevel
  ├── audit_hash: [u8; 32]
  ├── audit_expiry: i64
  ├── registered_at: i64
  ├── updated_at: i64
  └── bump: u8

ComplianceConfig (per authority)
  PDA: ["compliance_config", authority]
  ├── authority: Pubkey
  ├── pool_registry: Pubkey
  ├── kyc_registry: Pubkey      (links to transfer-hook registry)
  ├── jurisdiction_bitmask: u8  (6 bits, one per jurisdiction)
  ├── basic_trade_limit: u64
  ├── standard_trade_limit: u64
  ├── enhanced_trade_limit: u64
  ├── zk_verifier_key: Pubkey   (Pubkey::default() = disabled)
  ├── is_active: bool
  ├── max_route_hops: u8
  ├── created_at: i64
  ├── updated_at: i64
  └── bump: u8
```

## PDA Derivation

All PDAs use deterministic seeds. The TypeScript SDK provides helper functions that mirror the on-chain derivation.

| Account | Seeds | Program |
|---------|-------|---------|
| KycRegistry | `["kyc_registry", mint]` | transfer-hook |
| WhitelistEntry | `["whitelist", wallet]` | transfer-hook |
| ExtraAccountMetaList | `["extra-account-metas", mint]` | transfer-hook |
| CompliantPoolRegistry | `["pool_registry", authority]` | compliant-registry |
| PoolComplianceEntry | `["pool_entry", registry, amm_key]` | compliant-registry |
| ComplianceConfig | `["compliance_config", authority]` | compliant-registry |

The whitelist PDA uses wallet as the sole seed (not registry + wallet). This means each wallet has exactly one global whitelist entry, simplifying lookups and enabling the transfer hook to resolve entries without knowing which registry the wallet belongs to.

## Transfer Flow

When a Token-2022 transfer occurs on a mint with the transfer hook enabled:

```
1. User initiates transfer
   │
2. Token-2022 resolves ExtraAccountMetaList
   │  → Derives KycRegistry PDA from mint
   │  → Derives sender WhitelistEntry PDA from source token account
   │  → Derives recipient WhitelistEntry PDA from destination token account
   │
3. Transfer hook `execute` runs
   │
   ├─ Registry active?            → RegistryInactive error
   ├─ Sender whitelisted + valid? → SenderNotWhitelisted error
   ├─ Sender jurisdiction OK?     → JurisdictionNotAllowed error
   ├─ Sender daily limit OK?      → DailyLimitExceeded error
   ├─ Sender per-level limit OK?  → TransferExceedsLimit error
   ├─ Recipient whitelisted?      → RecipientNotWhitelisted error
   ├─ Recipient jurisdiction OK?  → JurisdictionNotAllowed error
   └─ Recipient per-level limit?  → TransferExceedsLimit error
   │
4. Transfer completes, TransferValidated event emitted
```

## Compliant Routing Flow

The `ComplianceAwareRouter` orchestrates Jupiter quotes through compliance checks:

```
1. getCompliantQuote(trader, quoteRequest)
   │
2. Check trader KYC
   │  → KycComplianceChecker → KycClient.checkCompliance()
   │  → Verify: active, not expired, meets min level, jurisdiction allowed
   │
3. Get Jupiter quote
   │  → JupiterAggregator.getQuote(request)
   │
4. Filter route for compliance
   │  → RouteComplianceFilter.checkRouteCompliance(quote)
   │  → Check each routePlan step's ammKey against PoolWhitelistManager
   │
5a. All hops compliant → return CompliantQuoteResult
   │
5b. Non-compliant hops found
    │  → Retry with onlyDirectRoutes: true
    │  → If direct route is compliant → return it
    │  → Otherwise → throw "No compliant route found"
```

## Jurisdiction Bitmask

Jurisdictions are encoded as a 6-bit bitmask for efficient on-chain storage:

```
Bit 0 = Japan      (0b000001)
Bit 1 = Singapore  (0b000010)
Bit 2 = Hong Kong  (0b000100)
Bit 3 = EU         (0b001000)
Bit 4 = USA        (0b010000)
Bit 5 = Other      (0b100000)

Example: 0b00101111 (47) = Japan + Singapore + Hong Kong + EU + Other (no USA)
Example: 0b00111111 (63) = All jurisdictions
```

## Package Dependency Graph

```
@accredit/router
  ├── @accredit/sdk
  │   └── @accredit/types
  └── @accredit/types

compliant-registry (Rust)
  └── accredit-types

transfer-hook (Rust)
  └── accredit-types
```
