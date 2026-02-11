use crate::kyc::Jurisdiction;

/// Constants for WhitelistEntry PDA derivation and logic.
/// The actual `#[account]` struct lives in the transfer-hook program
/// (which has `declare_id!`), but seed prefixes and helpers are shared here.
pub const WHITELIST_SEED_PREFIX: &[u8] = b"whitelist";
pub const KYC_REGISTRY_SEED_PREFIX: &[u8] = b"kyc_registry";
pub const SECONDS_PER_DAY: i64 = 86400;

/// Check if a whitelist entry is valid for transfers
pub fn is_entry_valid(is_active: bool, expiry_timestamp: i64, current_time: i64) -> bool {
    is_active && (expiry_timestamp == 0 || current_time < expiry_timestamp)
}

/// Check if transfer amount is within daily limit
pub fn can_transfer(
    is_active: bool,
    expiry_timestamp: i64,
    daily_limit: u64,
    daily_volume: u64,
    volume_reset_time: i64,
    amount: u64,
    current_time: i64,
) -> bool {
    if !is_entry_valid(is_active, expiry_timestamp, current_time) {
        return false;
    }
    if daily_limit == 0 {
        return true; // Unlimited
    }

    let effective_volume = if current_time - volume_reset_time >= SECONDS_PER_DAY {
        0
    } else {
        daily_volume
    };

    effective_volume.saturating_add(amount) <= daily_limit
}

/// Check if jurisdiction allows transfers (USA restricted)
pub fn is_jurisdiction_allowed_for_transfer(jurisdiction: &Jurisdiction) -> bool {
    !matches!(jurisdiction, Jurisdiction::Usa)
}
