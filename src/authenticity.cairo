#[starknet::contract]
pub mod Authenticity {
    use core::array::ArrayTrait;
    use core::ecdsa::check_ecdsa_signature;
    use core::hash::{HashStateExTrait, HashStateTrait};
    use core::num::traits::Zero;
    use core::pedersen::PedersenTrait;
    use starknet::storage::StoragePathEntry;
    // use starknet::contract_address::contract_address_try_from_felt252;
    use starknet::storage::{Map, StoragePointerReadAccess, StoragePointerWriteAccess};
    use starknet::{ContractAddress, get_block_timestamp, get_caller_address, get_contract_address};


    // Define structs
    #[derive(Drop, Serde, Clone, PartialEq)]
    struct Certificate {
        username: felt252,
        unique_id: felt252,
        serial: felt252,
        date: u64,
        owner: ContractAddress,
        metadata: Array<felt252>,
    }

    #[derive(Drop, Serde, Clone, PartialEq)]
    struct Signature {
        r: felt252,
        s: felt252,
    }

    #[derive(Drop, Serde, Clone, PartialEq, starknet::Store)]
    struct Manufacturer {
        manufacturer_address: ContractAddress,
        username: felt252,
    }

    // Define events
    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        ManufacturerRegistered: ManufacturerRegistered,
    }

    #[derive(Drop, starknet::Event)]
    struct ManufacturerRegistered {
        #[key]
        manufacturer_address: ContractAddress,
        username: felt252,
    }

    // Storage
    #[storage]
    struct Storage {
        owner: ContractAddress,
        manufacturers: Map<ContractAddress, Manufacturer>,
        names: Map<felt252, ContractAddress>,
        ownership: ContractAddress,
    }

    // Interface for external contract interaction
    #[starknet::interface]
    trait IOwnership<TContractState> {
        fn create_item(
            ref self: TContractState,
            caller: ContractAddress,
            certificate: Certificate,
            manufacturer_name: felt252,
        );
    }

    // Constructor
    #[constructor]
    fn constructor(
        ref self: ContractState, ownership_addr: ContractAddress, owner_addr: ContractAddress,
    ) {
        self.ownership.write(ownership_addr);
        self.owner.write(owner_addr);
    }

    // Interface implementation
    #[starknet::interface]
    trait IAuthenticity<TContractState> {
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

    #[abi(embed_v0)]
    impl AuthenticityImpl of IAuthenticity<ContractState> {
        fn manufacturer_registers(ref self: ContractState, username: felt252) {
            let caller = get_caller_address();
            assert(!caller.is_zero(), 'ZERO_ADDRESS_OWNER');

            // Check if username is already taken
            let manu_addr = self.names.entry(username).read();
            assert(manu_addr.is_zero(), 'NAME_NOT_AVAILABLE');

            // Check if caller is already registered
            let manu = self.manufacturers.entry(caller).read();
            assert(manu.manufacturer_address.is_zero(), 'ALREADY_REGISTERED');

            // Validate username length (simplified check)
            assert(username != 0, 'INVALID_MANUFACTURER_NAME');

            let manufacturer = Manufacturer { manufacturer_address: caller, username };
            self.manufacturers.entry(caller).write(manufacturer);
            self.names.entry(username).write(caller);

            self.emit(ManufacturerRegistered { manufacturer_address: caller, username });
        }

        fn get_manufacturer_by_name(self: @ContractState, username: felt252) -> ContractAddress {
            let manufacturer = self.names.entry(username).read();
            assert(!manufacturer.is_zero(), 'DOES_NOT_EXIST');
            manufacturer
        }

        fn get_manufacturer(self: @ContractState, user_address: ContractAddress) -> Manufacturer {
            let manufacturer = self.manufacturers.entry(user_address).read();
            assert(!manufacturer.manufacturer_address.is_zero(), 'DOES_NOT_EXIST');
            manufacturer
        }

        fn get_manufacturer_address(
            self: @ContractState, expected_manufacturer: ContractAddress,
        ) -> ContractAddress {
            let manufacturer = self
                .manufacturers
                .entry(expected_manufacturer)
                .read()
                .manufacturer_address;
            assert(
                !manufacturer.is_zero() && expected_manufacturer == manufacturer, 'DOES_NOT_EXIST',
            );
            manufacturer
        }

        fn verify_signature(
            self: @ContractState, certificate: Certificate, signature: Signature,
        ) -> bool {
            // Hash certificate data
            let mut state = PedersenTrait::new(0);
            state = state.update_with(certificate.username);
            state = state.update_with(certificate.unique_id);
            state = state.update_with(certificate.serial);
            state = state.update_with(certificate.date);
            state = state.update_with(certificate.owner);
            let metadata_hash = hash_array(certificate.metadata);
            state = state.update_with(metadata_hash);
            let message_hash = state.finalize();

            // Verify signature
            let manufacturer = self.get_manufacturer_address(certificate.owner);
            let is_valid = check_ecdsa_signature(
                message_hash,
                manufacturer.into(), // Public key (address as pubkey)
                signature.r,
                signature.s,
            );
            assert(is_valid, 'INVALID_SIGNATURE');
            true
        }

        fn user_claim_ownership(
            ref self: ContractState, certificate: Certificate, signature: Signature,
        ) {
            let caller = get_caller_address();
            assert(!caller.is_zero(), 'ADDRESS_ZERO');

            let is_valid = self.verify_signature(certificate.clone(), signature);
            assert(is_valid, 'INVALID_SIGNATURE');

            let manufacturer_name = self.manufacturers.entry(certificate.owner).read().username;
            let ownership = IOwnershipDispatcher { contract_address: self.ownership.read() };
            ownership.create_item(caller, certificate, manufacturer_name);
        }
    }

    // Helper function
    fn hash_array(array: Array<felt252>) -> felt252 {
        let mut state = PedersenTrait::new(0);
        let len = array.len();
        let mut i = 0;
        while i < len {
            state = state.update_with(*array.at(i));
            i += 1;
        }
        state.finalize()
    }
}
