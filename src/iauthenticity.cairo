use starknet::ContractAddress;
use crate::models::{Certificate, Manufacturer, Signature};

// Interface implementation
#[starknet::interface]
pub trait IAuthenticity<TContractState> {
    fn manufacturer_registers(ref self: TContractState, username: felt252);
    fn get_manufacturer_by_name(self: @TContractState, username: felt252) -> ContractAddress;
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


// Interface for external contract interaction
#[starknet::interface]
pub trait IOwnership<TContractState> {
    fn create_item(
        ref self: TContractState,
        caller: ContractAddress,
        certificate: Certificate,
        manufacturer_name: felt252,
    );
}
