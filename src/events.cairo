pub mod EriEvents {
    use starknet::ContractAddress;

    #[derive(Drop, starknet::Event)]
    pub struct ManufacturerRegistered {
        #[key]
        pub manufacturer_address: ContractAddress,
        pub manufacturer_name: felt252,
    }

    #[derive(Drop, starknet::Event)]
    pub struct ContractCreated {
        pub contract_address: ContractAddress,
        pub owner: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct UserRegistered {
        pub user_address: ContractAddress,
        pub username: felt252,
    }

    #[derive(Drop, starknet::Event)]
    pub struct ItemCreated {
        pub item_id: felt252,
        pub owner: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct OwnershipCode {
        pub ownership_code: felt252,
        pub temp_owner: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct OwnershipClaimed {
        pub new_owner: ContractAddress,
        pub old_owner: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct CodeRevoked {
        pub item_hash: felt252,
    }

    #[derive(Drop, starknet::Event)]
    pub struct DebugHash {
        pub debug_hash: felt252,
        pub res: bool,
    }

    #[derive(Drop, starknet::Event)]
    pub struct AfterName {
        pub name: felt252,
    }

    #[derive(Drop, starknet::Event)]
    pub struct AfterUniqueId {
        pub unique_id: felt252,
    }

    #[derive(Drop, starknet::Event)]
    pub struct AfterSerial {
        pub serial: felt252,
    }
    #[derive(Drop, starknet::Event)]
    pub struct AfterDate {
        pub date: felt252,
    }
    #[derive(Drop, starknet::Event)]
    pub struct AfterOwner {
        pub owner: felt252,
    }
    #[derive(Drop, starknet::Event)]
    pub struct AfterMetadata {
        pub metadata: felt252,
    }
    #[derive(Drop, starknet::Event)]
    pub struct Meta {
        pub meta: felt252,
    }

    #[derive(Drop, starknet::Event)]
    pub struct InMeta {
        pub input: felt252,
        pub meta: felt252,
    }
}

