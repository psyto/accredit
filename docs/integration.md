# Integration Guide

How to add Accredit compliance infrastructure to your Solana project.

## Directory Layout

Accredit is designed to sit alongside your project as a sibling directory:

```
/your/workspace/
├── accredit/        # This repo
├── your-project/    # Your project
└── ...
```

## Choosing Your Layer

**Core only** — Your project issues tokens with KYC-gated transfers but doesn't need DEX routing.

Import:
- Rust: `accredit-types` crate
- TypeScript: `@accredit/types`, `@accredit/sdk`
- Programs: `transfer-hook`

**Core + Routing** — Your project needs compliant DEX routing via Jupiter.

Additionally import:
- TypeScript: `@accredit/router`
- Programs: `compliant-registry`

## Rust Integration

### 1. Add the types crate

In your workspace `Cargo.toml`:

```toml
[workspace.dependencies]
accredit-types = { path = "../accredit/crates/accredit-types" }
```

In your program's `Cargo.toml`:

```toml
[dependencies]
accredit-types = { workspace = true }
```

### 2. Use shared types in your program

```rust
use accredit_types::{KycLevel, Jurisdiction, trade_limit_for_level, jurisdiction_allowed};

// Use enums in your account structs
#[account]
pub struct MyAccount {
    pub required_kyc: KycLevel,
    pub jurisdiction: Jurisdiction,
}

// Use helpers
let limit = trade_limit_for_level(&KycLevel::Standard);
let allowed = jurisdiction_allowed(&Jurisdiction::Japan);
```

### 3. Reference the transfer-hook program

In your `Anchor.toml`, add the transfer-hook program if you need to invoke it via CPI:

```toml
[programs.localnet]
transfer_hook = "4CoN4C1mqdkgvgQeXMSa1Pnb7guFH89DekEvRHgKmivf"

[programs.devnet]
transfer_hook = "4CoN4C1mqdkgvgQeXMSa1Pnb7guFH89DekEvRHgKmivf"
```

## TypeScript Integration

### 1. Add accredit packages to your workspace

If you use **pnpm**, add the accredit packages directory to your workspace:

```yaml
# pnpm-workspace.yaml
packages:
  - "packages/*"
  - "../accredit/packages/*"
```

If you use **yarn**, add it to your workspaces in `package.json`:

```json
{
  "workspaces": [
    "packages/*",
    "../accredit/packages/*"
  ]
}
```

### 2. Add dependencies

For **core only**:

```json
{
  "dependencies": {
    "@accredit/types": "workspace:*",
    "@accredit/sdk": "workspace:*"
  }
}
```

For **core + routing**:

```json
{
  "dependencies": {
    "@accredit/types": "workspace:*",
    "@accredit/sdk": "workspace:*",
    "@accredit/router": "workspace:*"
  }
}
```

### 3. Install and build

```bash
# From accredit directory — build TypeScript packages first
cd ../accredit && pnpm install && pnpm build

# From your project — install to link workspace packages
cd ../your-project && pnpm install  # or yarn install
```

### 4. Import and use

**Core: Check wallet compliance**

```typescript
import { Connection, PublicKey } from '@solana/web3.js';
import { KycClient, KycLevel } from '@accredit/sdk';

const connection = new Connection(rpcUrl);
const hookProgram = new PublicKey('4CoN4C1mqdkgvgQeXMSa1Pnb7guFH89DekEvRHgKmivf');

const kycClient = new KycClient(connection, hookProgram);

// Check if a wallet can transact
const result = await kycClient.checkCompliance(
  walletPubkey,
  KycLevel.Standard,
  0b00101111  // Japan + SG + HK + EU + Other
);

if (!result.isCompliant) {
  throw new Error(`Compliance failed: ${result.reason}`);
}
```

**Core: Derive PDAs for instruction building**

```typescript
import { findWhitelistEntryPda, findKycRegistryPda } from '@accredit/sdk';

const [entryPda] = findWhitelistEntryPda(wallet, hookProgram);
const [registryPda] = findKycRegistryPda(mint, hookProgram);
```

**Routing: Get a compliant swap quote**

```typescript
import { ComplianceAwareRouter } from '@accredit/router';

const router = new ComplianceAwareRouter(connection, registryAuthority);
await router.syncWhitelist();

const quote = await router.getCompliantQuote(
  traderWallet,
  {
    inputMint: inputMintAddress,
    outputMint: outputMintAddress,
    amount: amountInBaseUnits,
  },
  jurisdictionBitmask
);

// quote.quote contains the Jupiter QuoteResponse
// quote.wasFiltered indicates if the route was retried as direct-only
```

## Re-exporting Types

If your SDK re-exports KYC types, import from `@accredit/types` and re-export:

```typescript
// your-project/packages/sdk/src/types.ts
export { KycLevel, Jurisdiction } from '@accredit/types';
export type { WhitelistEntry, KycRegistry } from '@accredit/types';

// Keep your project-specific types here
export interface MyProjectSpecificType { ... }
```

## Token-2022 Mint Setup

To attach the transfer hook to a new token mint:

1. Create the mint with the transfer-hook extension pointing to `4CoN4C1mqdkgvgQeXMSa1Pnb7guFH89DekEvRHgKmivf`
2. Call `initialize_registry` with the mint to create the KYC registry
3. Call `initialize_extra_account_meta_list` with the mint to enable hook resolution
4. Call `add_to_whitelist` for each verified wallet

After setup, every `transfer_checked` on the mint will automatically invoke the hook.

## Program IDs

| Program | ID |
|---------|-----|
| Transfer Hook | `4CoN4C1mqdkgvgQeXMSa1Pnb7guFH89DekEvRHgKmivf` |
| Compliant Registry | `hhcx645NBLLRrKry3dkDMTMzZfrCUEJk3UurUYBxjww` |

These are the same on localnet and devnet. Mainnet program IDs will be published when deployed.
