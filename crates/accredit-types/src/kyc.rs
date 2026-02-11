use anchor_lang::prelude::*;

/// KYC verification levels for regulatory compliance
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, InitSpace, Debug)]
pub enum KycLevel {
    /// Basic verification (email, phone)
    Basic,
    /// Standard verification (ID document)
    Standard,
    /// Enhanced verification (video call, address proof)
    Enhanced,
    /// Institutional (corporate KYC/KYB)
    Institutional,
}

impl Default for KycLevel {
    fn default() -> Self {
        KycLevel::Basic
    }
}

/// Supported jurisdictions
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace, Debug)]
pub enum Jurisdiction {
    /// Japan (primary market)
    Japan,
    /// Singapore
    Singapore,
    /// Hong Kong
    HongKong,
    /// EU
    Eu,
    /// USA (restricted)
    Usa,
    /// Other
    Other,
}

impl Default for Jurisdiction {
    fn default() -> Self {
        Jurisdiction::Japan
    }
}
