use crate::kyc::{KycLevel, Jurisdiction};

/// Check if a jurisdiction is generally allowed for transfers
pub fn jurisdiction_allowed(j: &Jurisdiction) -> bool {
    !matches!(j, Jurisdiction::Usa)
}

/// Check if a jurisdiction is included in a bitmask
/// Bit mapping: 0=Japan, 1=Singapore, 2=HongKong, 3=Eu, 4=Usa, 5=Other
pub fn is_jurisdiction_in_bitmask(j: &Jurisdiction, bitmask: u8) -> bool {
    let bit = match j {
        Jurisdiction::Japan => 0,
        Jurisdiction::Singapore => 1,
        Jurisdiction::HongKong => 2,
        Jurisdiction::Eu => 3,
        Jurisdiction::Usa => 4,
        Jurisdiction::Other => 5,
    };
    (bitmask >> bit) & 1 == 1
}

/// Get the default per-transaction trade limit for a KYC level (in smallest unit, 6 decimals)
pub fn trade_limit_for_level(level: &KycLevel) -> u64 {
    match level {
        KycLevel::Basic => 100_000_000_000,         // 100,000 JPY
        KycLevel::Standard => 10_000_000_000_000,    // 10,000,000 JPY
        KycLevel::Enhanced => 100_000_000_000_000,   // 100,000,000 JPY
        KycLevel::Institutional => u64::MAX,          // No limit
    }
}
