use starknet::{ContractAddress};

 // Define structs
    #[derive(Drop, Serde, Clone, PartialEq)]
    pub struct Certificate {
       pub username: felt252,
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
    