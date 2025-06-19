pub mod Models {
    use starknet::ContractAddress;


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
