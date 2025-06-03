use core::hash::{HashStateExTrait, HashStateTrait};
use core::pedersen::PedersenTrait;
use starknet::ContractAddress;
use crate::errors::EriErrors::ZERO_ADDRESS;
use crate::utilities::Models::Item;
pub mod Models {
    use starknet::ContractAddress;

    #[derive(Copy, Drop, Serde, Clone, PartialEq)]
    pub struct Certificate {
        pub name: felt252,
        pub unique_id: felt252,
        pub serial: felt252,
        pub date: u64,
        pub owner: ContractAddress,
        pub metadata: Span<felt252> // Replace Array with Span for Copy compatibility
    }


    #[derive(Drop, Serde, Clone, PartialEq)]
    pub struct Sign {
        pub r: felt252,
        pub s: felt252,
    }


    #[derive(Drop, Serde, Clone, PartialEq, starknet::Store)]
    pub struct Manufacturer {
        pub manufacturer_address: ContractAddress,
        pub manufacturer_name: felt252,
        pub is_registered: bool,
        pub registered_at: u64,
    }

    #[derive(Copy, Drop, Serde, starknet::Store)]
    pub struct UserProfile {
        pub user_address: ContractAddress,
        pub username: felt252,
        pub is_registered: bool,
        pub registered_at: u64,
    }


    #[derive(Copy, Drop, Serde, starknet::Store)]
    pub struct Item {
        pub item_id: felt252,
        pub owner: ContractAddress,
        pub name: felt252,
        pub date: u64,
        pub manufacturer: felt252,
        pub serial: felt252,
        pub metadata_hash: felt252,
    }

    #[derive(Copy, Drop, Serde)]
    pub struct Owner {
        pub name: felt252,
        pub item_id: felt252,
        pub username: felt252,
        pub owner: ContractAddress,
    }
}

pub fn hash_array(data: Span<felt252>) -> felt252 {
    let mut state = PedersenTrait::new(0);

    // state = state.update_with(data.len());

    // for item in data {
    //     state = state.update_with(*item);
    // }
   

    for i in 0..data.len() {
        state = state.update_with(*data.at(i));
    }

    state.finalize()
}

pub fn deleted_item() -> Item {
    Item {
        item_id: 0,
        owner: 0x0.try_into().unwrap(),
        name: 0,
        date: 0,
        manufacturer: 0,
        serial: 0,
        metadata_hash: 0,
    }
}

pub fn address_zero_check(address: ContractAddress) {
    assert(address != 0x0.try_into().unwrap(), ZERO_ADDRESS);
}
//Ownership: 0x4c580b1e29a4ed5deedabe33b4ae7f3d8e87117b7b2901dfe13d3e5c64ff69b
//Authenticity: 0x7d1aae0ad4d3aa1fe7a76186e56d64458db90a045f1ef41a80abe38382b4753

// QWERTY
// POP
// ELON

// SAM1
// DUPL
// BENT


