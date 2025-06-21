pub mod EriErrors {
    pub const ZERO_ADDRESS: felt252 = 'ADDRESS ZERO IS NOT ALLOWED';
    pub const NAME_NOT_AVAILABLE: felt252 = 'USERNAME IS NOT AVAILABLE';
    pub const ALREADY_REGISTERED: felt252 = 'ADDRESS IS ALREADY REGISTERED';
    pub const INVALID_NAME: felt252 = 'NAME IS INVALID OR TOO SHORT';
    pub const INVALID_SIGNATURE: felt252 = 'INVALID SIGNATURE';
    pub const ALREADY_OWNED: felt252 = 'ITEM ALREADY OWNED';
    pub const ONLY_OWNER: felt252 = 'ONLY OWNER IS ALLOWED';
    pub const ONLY_AUTHENTICITY: felt252 = 'UNAUTHORIZED CALLER';
    pub const INVALID_ID: felt252 = 'Invalid item ID';
    pub const CANNOT_GENERATE: felt252 = 'Cannot generate for yourself';
    pub const UNCLAIMED: felt252 = 'Item not claimed yet';
    pub const INCONSISTENT_CLAIMER: felt252 = 'Unauthorized claimant';
    pub const INVALID: felt252 = 'Invalid item hash';
    pub const AUTHENTICITY_NOT_SET: felt252 = 'AUTHENTICITY NOT SET';
    pub const CLAIM_FAILED: felt252 = 'ITEM CLAIM FAILED';
    pub const INVALID_MESSAGE: felt252 = 'INVALID MESSAGE HASH';
}