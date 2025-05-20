#[starknet::contract]
pub mod Authenticity {
    use core::array::ArrayTrait;
    use core::ecdsa::check_ecdsa_signature;
    use core::hash::{HashStateExTrait, HashStateTrait};
    use core::num::traits::Zero;
    use core::pedersen::PedersenTrait;
    use starknet::storage::{
        Map, StoragePathEntry, StoragePointerReadAccess, StoragePointerWriteAccess,
    };
    use starknet::{ContractAddress, get_caller_address};
    use crate::errors::EriErrors::*;
    use crate::events::EriEvents::ManufacturerRegistered;
    use crate::interfaces::{IAuthenticity, IOwnershipDispatcher, IOwnershipDispatcherTrait};
    use crate::utilities::Models::{Certificate, Manufacturer, Signature};
    use crate::utilities::hash_array;

    //events
    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        ManufacturerRegistered: ManufacturerRegistered,
    }

    //storage
    #[storage]
    struct Storage {
        owner: ContractAddress,
        manufacturers: Map<ContractAddress, Manufacturer>,
        names: Map<felt252, ContractAddress>,
        ownership: ContractAddress,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState, ownership_addr: ContractAddress, owner_addr: ContractAddress,
    ) {
        self.ownership.write(ownership_addr);
        self.owner.write(owner_addr);
    }

    // 0x04caea06ed9c48e432f702d0da5dc2446bf7543837f0d2cc3a5f141d5224611c

    #[abi(embed_v0)]
    impl Authenticity of IAuthenticity<ContractState> {
        fn manufacturer_registers(ref self: ContractState, username: felt252) {
            let caller = get_caller_address();
            assert(!caller.is_zero(), ZERO_ADDRESS);

            // no duplicate username
            let manu_addr = self.names.entry(username).read();
            assert(manu_addr.is_zero(), NAME_NOT_AVAILABLE);

            // no duplicate address
            let manu = self.manufacturers.entry(caller).read();
            assert(manu.manufacturer_address.is_zero(), ALREADY_REGISTERED);

            // username length.. this wil be checked in the frontend
            assert(username != 0, INVALID_NAME);

            let manufacturer = Manufacturer { manufacturer_address: caller, username };

            self.manufacturers.entry(caller).write(manufacturer);
            self.names.entry(username).write(caller);

            self.emit(ManufacturerRegistered { manufacturer_address: caller, username });
        }

        fn get_manufacturer_by_name(self: @ContractState, username: felt252) -> ContractAddress {
            let manufacturer = self.names.entry(username).read();
            assert!(!manufacturer.is_zero(), "{:?} DOES_NOT_EXIST", username);
            manufacturer
        }

        fn get_manufacturer(self: @ContractState, user_address: ContractAddress) -> Manufacturer {
            let manufacturer = self.manufacturers.entry(user_address).read();
            assert!(
                !manufacturer.manufacturer_address.is_zero(), "{:?} DOES_NOT_EXIST", user_address,
            );
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
            assert!(
                !manufacturer.is_zero() && expected_manufacturer == manufacturer,
                "{:?} DOES_NOT_EXIST",
                expected_manufacturer,
            );
            manufacturer
        }

        // NOT YET TESTED
        fn verify_signature(
            self: @ContractState, certificate: Certificate, signature: Signature,
        ) -> bool {
            // to hash certificate data
            let mut state = PedersenTrait::new(0);
            state = state.update_with(certificate.name);
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

            assert(is_valid, INVALID_SIGNATURE);
            true
        }

        //NOT YET TESTED
        fn user_claim_ownership(
            ref self: ContractState, certificate: Certificate, signature: Signature,
        ) {
            let caller = get_caller_address();
            assert(!caller.is_zero(), ZERO_ADDRESS);

            let is_valid = self.verify_signature(certificate.clone(), signature);
            assert(is_valid, INVALID_SIGNATURE);

            let manufacturer_name = self.manufacturers.entry(certificate.owner).read().username;
            let ownership = IOwnershipDispatcher { contract_address: self.ownership.read() };
            ownership.create_item(caller, certificate, manufacturer_name);
        }
    }
}
