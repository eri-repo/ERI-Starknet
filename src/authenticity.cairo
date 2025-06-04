#[starknet::contract]
pub mod Authenticity {
    use core::array::ArrayTrait;
    use core::num::traits::Zero;
    use starknet::event::EventEmitter;
    use starknet::storage::{
        Map, StoragePathEntry, StoragePointerReadAccess, StoragePointerWriteAccess,
    };
    use starknet::{ContractAddress, get_block_timestamp, get_caller_address};
    use crate::errors::EriErrors::*;
    use crate::events::EriEvents::ManufacturerRegistered;
    use crate::interfaces::{IAuthenticity, IOwnershipDispatcher, IOwnershipDispatcherTrait};
    use crate::utilities::Models::{Certificate, Manufacturer};
    use crate::utilities::address_zero_check;

    // use core::ecdsa::check_ecdsa_signature;
    // use core::hash::{HashStateExTrait, HashStateTrait};
    // use starknet::eth_address::EthAddress;
    // use starknet::eth_signature::{public_key_point_to_eth_address, verify_eth_signature};
    // use starknet::secp256_trait::{Signature, recover_public_key, signature_from_vrs};
    // use starknet::secp256k1::Secp256k1Point;
    // use core::poseidon::PoseidonTrait;

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
        address_zero_check(ownership_addr);
        address_zero_check(owner_addr);

        self.ownership.write(ownership_addr);
        self.owner.write(owner_addr);
    }


    #[abi(embed_v0)]
    impl Authenticity of IAuthenticity<ContractState> {
        fn manufacturer_registers(ref self: ContractState, manufacturer_name: felt252) {
            let caller = get_caller_address();
            address_zero_check(caller);

            // no duplicate manufacturer_name
            assert(self.names.entry(manufacturer_name).read().is_zero(), NAME_NOT_AVAILABLE);

            // no duplicate address
            assert(!self.manufacturers.entry(caller).read().is_registered, ALREADY_REGISTERED);

            let manufacturer = Manufacturer {
                manufacturer_address: caller,
                manufacturer_name,
                is_registered: true,
                registered_at: get_block_timestamp(),
            };

            self.names.entry(manufacturer_name).write(caller);
            self.manufacturers.entry(caller).write(manufacturer);

            self.emit(ManufacturerRegistered { manufacturer_address: caller, manufacturer_name });
        }

        fn get_manufacturer_address_by_name(
            self: @ContractState, manufacturer_name: felt252,
        ) -> ContractAddress {
            let manufacturer_addr = self.names.entry(manufacturer_name).read();
            assert!(!manufacturer_addr.is_zero(), "{:?} DOES_NOT_EXIST", manufacturer_name);

            manufacturer_addr
        }

        fn get_manufacturer(self: @ContractState, user_address: ContractAddress) -> Manufacturer {
            address_zero_check(user_address);

            let manufacturer = self.manufacturers.entry(user_address).read();
            assert!(
                !manufacturer.manufacturer_address.is_zero(), "{:?} DOES_NOT_EXIST", user_address,
            );

            manufacturer
        }

        fn get_manufacturer_address(
            self: @ContractState, expected_manufacturer: ContractAddress,
        ) -> ContractAddress {
            address_zero_check(expected_manufacturer);

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

        fn user_claim_ownership(ref self: ContractState, certificate: Certificate) {
            let caller = get_caller_address();
            address_zero_check(caller);

            //to get the name of the manufacturer
            let manufacturer_name = self
                .manufacturers
                .entry(certificate.owner)
                .read()
                .manufacturer_name;
            let ownership = IOwnershipDispatcher { contract_address: self.ownership.read() };

            ownership.create_item(caller, certificate, manufacturer_name);
        }
    }
}
// MOVED TO THE FRONTEND
// fn verify_signature(
//     self: @ContractState, certificate: Certificate, signature: Signature,
// ) -> bool {

//     // to hash certificate data
//     let mut state = PedersenTrait::new(0);
//     state = state.update_with(certificate.name);
//     state = state.update_with(certificate.unique_id);
//     state = state.update_with(certificate.serial);
//     state = state.update_with(certificate.date);
//     state = state.update_with(certificate.owner);
//     let metadata_hash = hash_array(certificate.metadata);
//     state = state.update_with(metadata_hash);
//     let message_hash = state.finalize();

//     let manufacturer = self.get_manufacturer_address(certificate.owner);
//     let is_valid = check_ecdsa_signature(
//         message_hash,
//         manufacturer.into(),
//         signature.r,
//         signature.s,
//     );

//     assert(is_valid, INVALID_SIGNATURE);
//     true
// }


