use core::hash::{HashStateExTrait, HashStateTrait};
use core::pedersen::PedersenTrait;
use crate::utilities::Models::Item;

pub mod Models {
    use starknet::ContractAddress;

    #[derive(Drop, Serde, Clone, PartialEq)]
    pub struct Certificate {
        pub name: felt252,
        pub unique_id: felt252,
        pub serial: felt252,
        pub date: u64,
        pub owner: ContractAddress,
        pub metadata: Array<felt252>,
    }

    #[derive(Drop, Serde, Clone, PartialEq)]
    pub struct Signature {
        pub r: felt252,
        pub s: felt252,
    }


    #[derive(Drop, Serde, Clone, PartialEq, starknet::Store)]
    pub struct Manufacturer {
        pub manufacturer_address: ContractAddress,
        pub username: felt252,
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


pub fn hash_array(array: Array<felt252>) -> felt252 {
    let mut state = PedersenTrait::new(0);
    let mut len = array.len();
    let mut i = 0;
    while len != 0 {
        state = state.update_with(*array.at(i));
        len -= 1;
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
