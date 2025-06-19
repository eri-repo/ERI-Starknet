pub mod EriErrors {
    pub const ZERO_ADDRESS: felt252 = 'Address zero is not allowed';
    pub const NAME_NOT_AVAILABLE: felt252 = 'Username is not available';
    pub const ALREADY_REGISTERED: felt252 = 'Address is already registered';
    pub const INVALID_NAME: felt252 = 'Name is invalid or too short';
    pub const INVALID_SIGNATURE: felt252 = 'Signature is invalid';
    pub const ALREADY_OWNED: felt252 = 'Item already owned';
    pub const ONLY_OWNER: felt252 = 'Only owner is allowed';
    pub const ONLY_AUTHENTICITY: felt252 = 'Caller not allowed';
    pub const INVALID_ID: felt252 = 'Invalid item ID';
    pub const CANNOT_GENERATE: felt252 = 'Cannot generate for yourself';
    pub const UNCLAIMED: felt252 = 'Item not claimed yet';
    pub const INCONSISTENT_CLAIMER: felt252 = 'Unauthorized claimant';
    pub const INVALID: felt252 = 'Invalid item hash';
    pub const AUTHENTICITY_NOT_SET: felt252 = 'AUTHENTICITY NOT SET';
    pub const CLAIM_FAILED: felt252 = 'ITEM CLAIM FAILED';
}
