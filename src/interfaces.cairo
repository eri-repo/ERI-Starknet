use starknet::ContractAddress;
use crate::utilities::Models::*;

#[starknet::interface]
pub trait IAuthenticity<TContractState> {
    fn manufacturer_registers(ref self: TContractState, manufacturer_name: felt252);
    fn get_manufacturer_address_by_name(self: @TContractState, manufacturer_name: felt252) -> ContractAddress;
    fn get_manufacturer(self: @TContractState, user_address: ContractAddress) -> Manufacturer;
    fn get_manufacturer_address(
        self: @TContractState, expected_manufacturer: ContractAddress,
    ) -> ContractAddress;
    fn verify_signature(
        self: @TContractState, certificate: Certificate, signature: Signature,
    ) -> bool;
    fn user_claim_ownership(
        ref self: TContractState, certificate: Certificate, signature: Signature,
    );
}


#[starknet::interface]
pub trait IOwnership<TContractState> {
    fn user_registers(ref self: TContractState, username: felt252);
    fn get_user(self: @TContractState, user_address: ContractAddress) -> UserProfile;
    fn create_item(
        ref self: TContractState,
        _owner: ContractAddress,
        certificate: Certificate,
        manufacturer_name: felt252,
    );
    fn get_all_items_for(self: @TContractState, user: ContractAddress) -> Array<Item>;
    fn generate_change_of_ownership_code(
        ref self: TContractState, item_id: felt252, temp_owner: ContractAddress,
    );
    fn new_owner_claim_ownership(ref self: TContractState, item_hash: felt252);
    fn get_temp_owner(self: @TContractState, item_hash: felt252) -> ContractAddress;
    fn owner_revoke_code(ref self: TContractState, item_hash: felt252);
    fn get_item(self: @TContractState, item_id: felt252) -> Item;
    fn verify_ownership(self: @TContractState, item_id: felt252) -> Owner;
    fn is_owner(self: @TContractState, user: ContractAddress, item_id: felt252) -> bool;
}
