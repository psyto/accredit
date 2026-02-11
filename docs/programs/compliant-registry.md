# Compliant Registry Program

**Program ID:** `hhcx645NBLLRrKry3dkDMTMzZfrCUEJk3UurUYBxjww`

On-chain registry of audited DEX liquidity pools. The compliance router uses this registry to ensure trade routes only pass through pools that meet regulatory requirements. Each pool entry tracks its audit status, jurisdiction, and required KYC level.

## Accounts

### CompliantPoolRegistry

One registry per authority. Manages a collection of audited pools.

| Field | Type | Description |
|-------|------|-------------|
| `authority` | `Pubkey` | Registry admin |
| `pool_count` | `u32` | Number of registered pools |
| `min_kyc_level` | `KycLevel` | Minimum KYC level for traders using this registry |
| `is_active` | `bool` | Whether the registry accepts new registrations |
| `created_at` | `i64` | Unix timestamp |
| `updated_at` | `i64` | Unix timestamp |
| `bump` | `u8` | PDA bump seed |

**PDA seeds:** `["pool_registry", authority]`

### PoolComplianceEntry

One entry per pool. Stores the pool's audit and compliance metadata.

| Field | Type | Description |
|-------|------|-------------|
| `amm_key` | `Pubkey` | AMM/pool address (Jupiter `ammKey`) |
| `registry` | `Pubkey` | Parent CompliantPoolRegistry |
| `operator` | `Pubkey` | Pool operator |
| `dex_label` | `String` | DEX name, e.g. "Raydium", "Orca" (max 32 chars) |
| `status` | `PoolStatus` | Active / Suspended / Revoked |
| `jurisdiction` | `Jurisdiction` | Where the pool operates |
| `kyc_level` | `KycLevel` | Minimum KYC level for this pool |
| `audit_hash` | `[u8; 32]` | Hash of the compliance audit report |
| `audit_expiry` | `i64` | When the audit expires (0 = no expiry) |
| `registered_at` | `i64` | Unix timestamp |
| `updated_at` | `i64` | Unix timestamp |
| `bump` | `u8` | PDA bump seed |

**PDA seeds:** `["pool_entry", registry, amm_key]`

### ComplianceConfig

Links a pool registry to a transfer-hook KYC registry. Defines trade rules for the combined system.

| Field | Type | Description |
|-------|------|-------------|
| `authority` | `Pubkey` | Config admin |
| `pool_registry` | `Pubkey` | Associated CompliantPoolRegistry |
| `kyc_registry` | `Pubkey` | Transfer-hook KycRegistry address |
| `jurisdiction_bitmask` | `u8` | Allowed jurisdictions (6-bit mask) |
| `basic_trade_limit` | `u64` | Max trade for Basic KYC (0 = unlimited) |
| `standard_trade_limit` | `u64` | Max trade for Standard KYC (0 = unlimited) |
| `enhanced_trade_limit` | `u64` | Max trade for Enhanced KYC (0 = unlimited) |
| `zk_verifier_key` | `Pubkey` | ZK verifier program (default = disabled) |
| `is_active` | `bool` | Whether config is active |
| `max_route_hops` | `u8` | Maximum hops in a route |
| `created_at` | `i64` | Unix timestamp |
| `updated_at` | `i64` | Unix timestamp |
| `bump` | `u8` | PDA bump seed |

**PDA seeds:** `["compliance_config", authority]`

## Pool Status Lifecycle

```
         add_compliant_pool
              │
              ▼
         ┌─────────┐
         │  Active  │ ◄── reinstate_pool
         └────┬─────┘
              │
    ┌─────────┼──────────┐
    │ suspend  │          │ revoke
    ▼          │          ▼
┌───────────┐  │   ┌───────────┐
│ Suspended │──┘   │  Revoked  │  (permanent)
└───────────┘      └───────────┘
      │ revoke
      └────────────►
```

- **Active** — Pool is compliant and available for routing
- **Suspended** — Temporarily blocked; can be reinstated
- **Revoked** — Permanently removed; cannot be reinstated

## Instructions

### `initialize_pool_registry`

Create a new pool registry.

**Parameters:**

| Field | Type | Description |
|-------|------|-------------|
| `min_kyc_level` | `KycLevel` | Minimum KYC level for traders |

**Accounts:**

| Account | Signer | Writable | Description |
|---------|--------|----------|-------------|
| `registry` | No | Yes | CompliantPoolRegistry PDA (initialized) |
| `authority` | Yes | Yes | Registry admin (pays rent) |
| `system_program` | No | No | System program |

### `add_compliant_pool`

Register a pool as compliant. Requires the registry to be active.

**Parameters:**

| Field | Type | Description |
|-------|------|-------------|
| `amm_key` | `Pubkey` | Pool's AMM address |
| `dex_label` | `String` | DEX name (max 32 chars) |
| `jurisdiction` | `Jurisdiction` | Pool's jurisdiction |
| `kyc_level` | `KycLevel` | Minimum KYC level for this pool |
| `audit_hash` | `[u8; 32]` | Compliance audit report hash |
| `audit_expiry` | `i64` | Audit expiry timestamp |

**Accounts:**

| Account | Signer | Writable | Description |
|---------|--------|----------|-------------|
| `registry` | No | Yes | CompliantPoolRegistry PDA |
| `pool_entry` | No | Yes | PoolComplianceEntry PDA (initialized) |
| `authority` | Yes | Yes | Registry authority (pays rent) |
| `system_program` | No | No | System program |

### `suspend_pool`

Temporarily suspend a pool. Only works on Active pools.

### `revoke_pool`

Permanently revoke a pool. Works on Active or Suspended pools. Decrements `pool_count`.

### `reinstate_pool`

Re-activate a suspended pool. Only works on Suspended pools.

**Shared accounts for suspend/revoke/reinstate:**

| Account | Signer | Writable | Description |
|---------|--------|----------|-------------|
| `registry` | No | Yes | CompliantPoolRegistry PDA |
| `pool_entry` | No | Yes | PoolComplianceEntry PDA |
| `authority` | Yes | No | Registry authority |

### `initialize_compliance_config`

Create a compliance config linking a pool registry to a transfer-hook KYC registry.

**Parameters:**

| Field | Type | Description |
|-------|------|-------------|
| `jurisdiction_bitmask` | `u8` | Allowed jurisdictions |
| `basic_trade_limit` | `u64` | Max trade for Basic KYC |
| `standard_trade_limit` | `u64` | Max trade for Standard KYC |
| `enhanced_trade_limit` | `u64` | Max trade for Enhanced KYC |
| `zk_verifier_key` | `Pubkey` | ZK verifier (or Pubkey::default()) |
| `max_route_hops` | `u8` | Max hops in a route |

**Accounts:**

| Account | Signer | Writable | Description |
|---------|--------|----------|-------------|
| `config` | No | Yes | ComplianceConfig PDA (initialized) |
| `registry` | No | No | CompliantPoolRegistry PDA |
| `kyc_registry` | No | No | Transfer-hook KycRegistry |
| `authority` | Yes | Yes | Authority (pays rent) |
| `system_program` | No | No | System program |

### `verify_compliant_route`

Batch-verify that all AMM keys in a route are compliant. Each AMM key must have a corresponding `PoolComplianceEntry` passed as a remaining account.

**Parameters:**

| Field | Type | Description |
|-------|------|-------------|
| `amm_keys` | `Vec<Pubkey>` | AMM keys in the route |

**Validation per hop:**
1. Pool entry belongs to the correct registry
2. Pool entry's `amm_key` matches the provided key
3. Pool status is `Active`
4. Audit is not expired (if `audit_expiry > 0`)

**Accounts:**

| Account | Signer | Writable | Description |
|---------|--------|----------|-------------|
| `config` | No | No | ComplianceConfig PDA |
| `registry` | No | No | CompliantPoolRegistry PDA |
| *remaining_accounts* | No | No | One PoolComplianceEntry per AMM key |

## Events

| Event | Fields | Description |
|-------|--------|-------------|
| `PoolRegistryCreated` | registry, authority, min_kyc_level | New registry |
| `PoolAdded` | registry, amm_key, status | Pool registered |
| `PoolStatusChanged` | registry, amm_key, new_status | Pool suspended/revoked/reinstated |
| `ComplianceConfigCreated` | config, pool_registry, kyc_registry | Config created |
| `RouteVerified` | config, registry, hop_count, verified_at | Route passed compliance |

## Error Codes

| Error | Description |
|-------|-------------|
| `Unauthorized` | Signer is not the registry authority |
| `PoolAlreadyRegistered` | Pool AMM key already exists in registry |
| `PoolNotActive` | Pool is not in Active status |
| `PoolAlreadySuspended` | Pool is already Suspended |
| `PoolAlreadyRevoked` | Pool is already Revoked |
| `InvalidPoolStatus` | Current status doesn't allow the operation |
| `AuditExpired` | Pool's audit has expired |
| `InsufficientKycLevel` | Trader's KYC level is too low |
| `JurisdictionNotAllowed` | Jurisdiction is not in the bitmask |
| `NonCompliantRoute` | Route contains a non-compliant pool |
| `RegistryInactive` | Registry is not active |
| `ComplianceConfigInactive` | Compliance config is not active |
| `TradeLimitExceeded` | Trade amount exceeds KYC level limit |
| `EmptyRoute` | No AMM keys provided |
| `RouteTooLong` | Route exceeds `max_route_hops` |
