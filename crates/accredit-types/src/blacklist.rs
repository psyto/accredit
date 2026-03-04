/// Constants for BlacklistEntry PDA derivation and logic.
/// The actual `#[account]` struct lives in the transfer-hook program
/// (which has `declare_id!`), but seed prefixes and helpers are shared here.
pub const BLACKLIST_SEED_PREFIX: &[u8] = b"blacklist";

/// Maximum length of a blacklist reason string
pub const MAX_REASON_LEN: usize = 64;

/// Check if a blacklist entry is currently active
pub fn is_blacklisted(is_active: bool) -> bool {
    is_active
}
