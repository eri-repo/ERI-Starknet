pub mod EriEvents {
    use starknet::ContractAddress;

    #[derive(Drop, starknet::Event)]
    pub struct ManufacturerRegistered {
        #[key]
        pub manufacturer_address: ContractAddress,
        #[key]
        pub manufacturer_name: felt252,
    }

    #[derive(Drop, starknet::Event)]
    pub struct ContractCreated {
        #[key]
        pub contract_address: ContractAddress,
        #[key]
        pub owner: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct UserRegistered {
        #[key]
        pub user_address: ContractAddress,
        #[key]
        pub username: felt252,
    }

    #[derive(Drop, starknet::Event)]
    pub struct ItemCreated {
        #[key]
        pub item_id: felt252,
        #[key]
        pub owner: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct OwnershipCode {
        #[key]
        pub ownership_code: felt252,
        #[key]
        pub temp_owner: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct OwnershipClaimed {
        #[key]
        pub new_owner: ContractAddress,
        #[key]
        pub old_owner: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct CodeRevoked {
        #[key]
        pub item_hash: felt252,
    }
    #[derive(Drop, starknet::Event)]
    pub struct AuthenticitySet {
        #[key]
        pub authenticity_address: ContractAddress,
    }
}