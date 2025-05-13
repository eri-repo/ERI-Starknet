#[starknet::contract]
mod Authenticity {
    use starknet::{
        ContractAddress, get_caller_address, get_block_timestamp,
        contract_address_const, ecdsa::check_ecdsa_signature
    };
    use core::num::traits::Zero;
    use core::array::ArrayTrait;
    use core::pedersen::PedersenTrait;
    use core::hash::{HashStateTrait, HashStateExTrait};


    







//     use starknet::storage::{LegacyMap, Storage};

// #[storage]
// struct Storage {
//     manufacturers: LegacyMap<felt252, felt252>, // Mapping from address to manufacturer name
// }

// #[external]
// fn register_manufacturer(name: felt252) {
//     let caller = get_caller_address();
//     let existing = manufacturers::read(caller);
//     assert(existing == 0, 'Manufacturer already registered');
//     manufacturers::write(caller, name);
// }


// use starknet::ecdsa::{ecdsa_recover, ecdsa_verify};

// fn verify_signature(cert: Certificate, signature: (felt252, felt252)) -> bool {
//     let message_hash = compute_certificate_hash(cert);
//     let recovered_address = ecdsa_recover(message_hash, signature);
//     let expected_address = cert.owner;
//     return recovered_address == expected_address;
// }








    #[storage]
    struct Storage {
        ownership: ContractAddress,
        manufacturers: LegacyMap::<ContractAddress, Manufacturer>,
        names: LegacyMap::<felt252, ContractAddress>,
    }

    #[derive(Copy, Drop, Serde)]
    struct Manufacturer {
        manufacturer_address: ContractAddress,
        name: felt252,
    }

    #[derive(Copy, Drop, Serde)]
    struct Certificate {
        name: felt252,
        unique_id: felt252,
        serial: felt252,
        date: u64,
        owner: ContractAddress,
        metadata: Array<felt252>,
    }

    #[derive(Copy, Drop, Serde)]
    struct Signature {
        r: felt252,
        s: felt252,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        ManufacturerRegistered: ManufacturerRegistered,
    }

    #[derive(Drop, starknet::Event)]
    struct ManufacturerRegistered {
        manufacturer_address: ContractAddress,
        name: felt252,
    }

    #[starknet::interface]
    trait IAuthenticity<TContractState> {
        fn manufacturer_registers(ref self: TContractState, name: felt252);
        fn get_manufacturer_by_name(self: @TContractState, name: felt252) -> ContractAddress;
        fn get_manufacturer(self: @TContractState, user_address: ContractAddress) -> Manufacturer;
        fn get_manufacturer_address(self: @TContractState, expected_manufacturer: ContractAddress) -> ContractAddress;
        fn verify_signature(self: @TContractState, certificate: Certificate, signature: Signature) -> bool;
        fn user_claim_ownership(ref self: TContractState, certificate: Certificate, signature: Signature);
    }

    #[starknet::interface]
    trait IOwnership<TContractState> {
        fn create_item(ref self: TContractState, caller: ContractAddress, certificate: Certificate, manufacturer_name: felt252);
    }

    #[constructor]
    fn constructor(ref self: ContractState, ownership: ContractAddress) {
        self.ownership.write(ownership);
    }

    #[external(v0)]
    impl AuthenticityImpl of IAuthenticity<ContractState> {
        fn manufacturer_registers(ref self: ContractState, name: felt252) {
            let caller = get_caller_address();
            assert(!caller.is_zero(), 'ADDRESS_ZERO');

            assert(!self.is_registered(caller), 'ALREADY_REGISTERED');
            assert(name != 0, 'INVALID_MANUFACTURER_NAME');
            assert(!self.names.read(name).is_non_zero(), 'NAME_NOT_AVAILABLE');

            let manufacturer = Manufacturer {
                manufacturer_address: caller,
                name: name,
            };

            self.manufacturers.write(caller, manufacturer);
            self.names.write(name, caller);
            self.emit(ManufacturerRegistered { manufacturer_address: caller, name: name });
        }

        fn get_manufacturer_by_name(self: @ContractState, name: felt252) -> ContractAddress {
            let manufacturer = self.names.read(name);
            assert(!manufacturer.is_zero(), 'DOES_NOT_EXIST');
            manufacturer
        }

        fn get_manufacturer(self: @ContractState, user_address: ContractAddress) -> Manufacturer {
            let manufacturer = self.manufacturers.read(user_address);
            assert(!manufacturer.manufacturer_address.is_zero(), 'DOES_NOT_EXIST');
            manufacturer
        }

        fn get_manufacturer_address(self: @ContractState, expected_manufacturer: ContractAddress) -> ContractAddress {
            let manufacturer = self.manufacturers.read(expected_manufacturer).manufacturer_address;
            assert(!manufacturer.is_zero() && expected_manufacturer == manufacturer, 'DOES_NOT_EXIST');
            manufacturer
        }

        fn verify_signature(self: @ContractState, certificate: Certificate, signature: Signature) -> bool {
            // Hash certificate data (simplified replacement for EIP-712)
            let mut state = PedersenTrait::new(0);
            state = state.update_with(certificate.name);
            state = state.update_with(certificate.unique_id);
            state = state.update_with(certificate.serial);
            state = state.update_with(certificate.date.into());
            state = state.update_with(certificate.owner.into());
            let metadata_hash = hash_array(certificate.metadata);
            state = state.update_with(metadata_hash);
            let message_hash = state.finalize();

            // Verify signature
            let manufacturer = self.get_manufacturer_address(certificate.owner);
            let is_valid = check_ecdsa_signature(
                message_hash,
                manufacturer.into(), // Public key (address as pubkey)
                signature.r,
                signature.s
            );
            assert(is_valid, 'INVALID_SIGNATURE');
            true
        }

        fn user_claim_ownership(ref self: ContractState, certificate: Certificate, signature: Signature) {
            let caller = get_caller_address();
            assert(!caller.is_zero(), 'ADDRESS_ZERO');

            let is_valid = self.verify_signature(certificate, signature);
            assert(is_valid, 'INVALID_SIGNATURE');

            let manufacturer_name = self.manufacturers.read(certificate.owner).name;
            let ownership = IOwnershipDispatcher { contract_address: self.ownership.read() };
            ownership.create_item(caller, certificate, manufacturer_name);
        }
    }

    fn is_registered(self: @ContractState, user: ContractAddress) -> bool {
        self.manufacturers.read(user).manufacturer_address.is_non_zero()
    }

    fn hash_array(array: Array<felt252>) -> felt252 {
        let mut state = PedersenTrait::new(0);
        let mut i = 0;
        loop {
            if i >= array.len() {
                break;
            }
            state = state.update_with(*array.at(i));
            i += 1;
        };
        state.finalize()
    }
}



#[cfg(test)]
mod tests {
    use super::{Authenticity, IAuthenticityDispatcher, IAuthenticityDispatcherTrait};
    use starknet::{
        ContractAddress, contract_address_const, syscalls::deploy_syscall,
        testing::set_caller_address
    };
    use core::num::traits::Zero;

    fn deploy_contract(ownership: ContractAddress) -> IAuthenticityDispatcher {
        let mut calldata = array![ownership.into()];
        let (address, _) = deploy_syscall(
            Authenticity::TEST_CLASS_HASH.try_into().unwrap(), 0, calldata.span(), false
        ).unwrap();
        IAuthenticityDispatcher { contract_address: address }
    }

    #[test]
    #[available_gas(2000000)]
    fn test_manufacturer_registers() {
        let ownership = contract_address_const::<0x999>();
        let contract = deploy_contract(ownership);
        let caller = contract_address_const::<0x123>();
        set_caller_address(caller);

        contract.manufacturer_registers('Xiaomi');
        let manufacturer = contract.get_manufacturer(caller);
        assert_eq!(manufacturer.manufacturer_address, caller);
        assert_eq!(manufacturer.name, 'Xiaomi');
        assert_eq!(contract.get_manufacturer_by_name('Xiaomi'), caller);
    }

    #[test]
    #[available_gas(2000000)]
    #[should_panic(expected: ('ADDRESS_ZERO',))]
    fn test_manufacturer_registers_zero_address() {
        let ownership = contract_address_const::<0x999>();
        let contract = deploy_contract(ownership);
        set_caller_address(contract_address_const::<0>());
        contract.manufacturer_registers('Xiaomi');
    }

    #[test]
    #[available_gas(2000000)]
    #[should_panic(expected: ('ALREADY_REGISTERED',))]
    fn test_manufacturer_registers_duplicate() {
        let ownership = contract_address_const::<0x999>();
        let contract = deploy_contract(ownership);
        let caller = contract_address_const::<0x123>();
        set_caller_address(caller);
        contract.manufacturer_registers('Xiaomi');
        contract.manufacturer_registers('Samsung');
    }
}