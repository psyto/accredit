// Re-export enums, constants, and helpers from accredit-types
pub use accredit_types::{
    KycLevel, Jurisdiction,
    WHITELIST_SEED_PREFIX, KYC_REGISTRY_SEED_PREFIX, SECONDS_PER_DAY,
    trade_limit_for_level, jurisdiction_allowed, is_jurisdiction_in_bitmask,
};

use anchor_lang::prelude::*;

/// Whitelist entry for a verified wallet (unified superset)
///
/// Defined here (in the program crate) so `#[account]` can reference `crate::ID`.
/// Enums and helper logic come from `accredit-types`.
#[account]
#[derive(InitSpace)]
pub struct WhitelistEntry {
    /// Wallet address
    pub wallet: Pubkey,

    /// Associated KYC registry
    pub registry: Pubkey,

    /// KYC verification level
    pub kyc_level: KycLevel,

    /// User's jurisdiction
    pub jurisdiction: Jurisdiction,

    /// Encrypted KYC data hash (NaCl box)
    pub kyc_hash: [u8; 32],

    /// Is entry active
    pub is_active: bool,

    /// Daily transaction limit (0 = unlimited / use default per-level limit)
    pub daily_limit: u64,

    /// Accumulated daily volume
    pub daily_volume: u64,

    /// Last volume reset timestamp
    pub volume_reset_time: i64,

    /// Verification timestamp
    pub verified_at: i64,

    /// Expiry timestamp
    pub expiry_timestamp: i64,

    /// Last activity timestamp
    pub last_activity: i64,

    /// Creation timestamp
    pub created_at: i64,

    /// Bump seed
    pub bump: u8,
}

impl WhitelistEntry {
    pub const SEED_PREFIX: &'static [u8] = WHITELIST_SEED_PREFIX;

    /// Check if entry is valid for transfers
    pub fn is_valid(&self, current_time: i64) -> bool {
        accredit_types::is_entry_valid(self.is_active, self.expiry_timestamp, current_time)
    }

    /// Check if transfer amount is within daily limit
    pub fn can_transfer(&self, amount: u64, current_time: i64) -> bool {
        accredit_types::can_transfer(
            self.is_active,
            self.expiry_timestamp,
            self.daily_limit,
            self.daily_volume,
            self.volume_reset_time,
            amount,
            current_time,
        )
    }

    /// Update daily volume
    pub fn record_transfer(&mut self, amount: u64, current_time: i64) {
        if current_time - self.volume_reset_time >= SECONDS_PER_DAY {
            self.daily_volume = amount;
            self.volume_reset_time = current_time;
        } else {
            self.daily_volume = self.daily_volume.saturating_add(amount);
        }
        self.last_activity = current_time;
    }

    /// Check if jurisdiction allows transfers
    pub fn jurisdiction_allowed(&self) -> bool {
        accredit_types::is_jurisdiction_allowed_for_transfer(&self.jurisdiction)
    }
}

/// KYC Registry for managing verified wallets (unified superset)
#[account]
#[derive(InitSpace)]
pub struct KycRegistry {
    /// Registry authority (compliance officer)
    pub authority: Pubkey,

    /// Associated stablecoin mint
    pub mint: Pubkey,

    /// Total whitelisted wallets (u64 for wider range)
    pub whitelist_count: u64,

    /// Is registry active
    pub is_active: bool,

    /// Require KYC for all transfers
    pub require_kyc: bool,

    /// Allow transfers between verified wallets only
    pub verified_only: bool,

    /// Creation timestamp
    pub created_at: i64,

    /// Last updated timestamp
    pub updated_at: i64,

    /// Bump seed
    pub bump: u8,
}

impl KycRegistry {
    pub const SEED_PREFIX: &'static [u8] = KYC_REGISTRY_SEED_PREFIX;

    pub fn is_active(&self) -> bool {
        self.is_active
    }
}
