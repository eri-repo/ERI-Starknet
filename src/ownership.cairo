#[starknet::contract]
mod Ownership {
    use core::hash::{HashStateExTrait, HashStateTrait};
    use core::num::traits::Zero;
    use core::pedersen::PedersenTrait;
    use starknet::storage::{
        Map, StoragePathEntry, StoragePointerReadAccess, StoragePointerWriteAccess,
    };
    use starknet::{ContractAddress, get_block_timestamp, get_caller_address, get_contract_address};
    use crate::errors::EriErrors::*;
    use crate::events::EriEvents::*;
    use crate::interfaces::IOwnership;
    use crate::utilities::Models::{Certificate, Item, Owner, UserProfile};
    use crate::utilities::{address_zero_check, hash_array};

    #[storage]
    struct Storage {
        owner: ContractAddress,
        users: Map<felt252, UserProfile>, // username -> UserProfile
        usernames: Map<ContractAddress, felt252>, // user_address -> username
        items: Map<felt252, Item>, // item_id -> Item
        my_items: Map<ContractAddress, Map<u32, felt252>>, // (user, index) -> item_id
        number_of_items: Map<ContractAddress, u32>, // user -> item count
        temp: Map<felt252, ContractAddress>, // item_hash -> temp_owner
        temp_owners: Map<
            felt252, Map<ContractAddress, felt252>,
        > // (item_hash, temp_owner) -> item_id
    }


    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        ContractCreated: ContractCreated,
        UserRegistered: UserRegistered,
        ItemCreated: ItemCreated,
        OwnershipCode: OwnershipCode,
        OwnershipClaimed: OwnershipClaimed,
        CodeRevoked: CodeRevoked,
    }

    #[constructor]
    fn constructor(ref self: ContractState, _owner: ContractAddress) {
        address_zero_check(_owner);

        self.owner.write(_owner);

        self.emit(ContractCreated { contract_address: get_contract_address(), owner: _owner });
    }

    #[abi(embed_v0)] ///on a view function, the get_caller_address() is address zero because the the transaction is free so no need you being the caller
    impl Ownership of IOwnership<ContractState> {
        fn user_registers(ref self: ContractState, username: felt252) {
            let caller = get_caller_address();

            address_zero_check(caller);
            assert(!self.users.entry(username).read().is_registered, NAME_NOT_AVAILABLE);
            assert(self.usernames.entry(caller).read() == 0, ALREADY_REGISTERED);

            let user = UserProfile {
                user_address: caller,
                username,
                is_registered: true,
                registered_at: get_block_timestamp(),
            };

            self.usernames.entry(caller).write(username);
            self.users.entry(username).write(user);

            self.emit(UserRegistered { user_address: caller, username });
        }


        fn get_user(self: @ContractState, user_address: ContractAddress) -> UserProfile {
            let username = self.usernames.entry(user_address).read();

            assert!(!username.is_zero(), "{:?} DOES_NOT_EXIST", user_address);

            self.users.entry(username).read()
        }

        fn create_item(
            ref self: ContractState,
            _owner: ContractAddress,  certificate: Certificate,
            manufacturer_name: felt252,
        ) {
            assert(_owner != 0x0.try_into().unwrap(), ZERO_ADDRESS);
            is_registered(@self, _owner);

            let item_id = certificate.unique_id;
            assert(!item_id.is_zero(), INVALID_ID);

            assert(self.items.entry(item_id).read().owner.is_zero(), ALREADY_OWNED);

            let item = Item {
                item_id,
                owner: _owner,
                name: certificate.name,
                date: certificate.date,
                manufacturer: manufacturer_name,
                serial: certificate.serial,
                metadata_hash: hash_array(certificate.metadata),
            };

            //this is the only place where Item will be saved, others will reference the id
            self.items.entry(item_id).write(item);

            let index = self.number_of_items.entry(_owner).read();

            self
                .my_items
                .entry(_owner)
                .entry(index)
                .write(item_id); //the first is 0 so the loop must start from 0
            self.number_of_items.entry(_owner).write(index + 1);

            self.emit(ItemCreated { item_id, owner: _owner });
        }

        fn get_item(self: @ContractState, item_id: felt252) -> Item {
            let item = self.items.entry(item_id).read();

            assert!(!item.owner.is_zero(), "{:?} DOES_NOT_EXIST", item_id);

            item
        }

        fn get_all_items_for(self: @ContractState, user: ContractAddress) -> Array<Item> {
            let mut items = ArrayTrait::new();
            let mut no_of_items = self.number_of_items.entry(user).read();

            if no_of_items == 0 {
                return items;
            }

            for each in 0..no_of_items {
                let item_id = self.my_items.entry(user).entry(each).read();

                let item = self.items.entry(item_id).read();

                if item.owner != user {
                    continue;
                }
                items.append(item); //later, I'd put the first item in the last position
            }
            items
        }

        fn generate_change_of_ownership_code(
            ref self: ContractState, item_id: felt252, temp_owner: ContractAddress,
        ) {
            let caller = get_caller_address();

            address_zero_check(temp_owner);

            assert(temp_owner != caller, CANNOT_GENERATE);

            let item = self.items.entry(item_id).read();

            assert(item.owner == caller, ONLY_OWNER);

            assert!(!item.owner.is_zero(), "{:?} DOES_NOT_EXIST", item_id);

            let mut state = PedersenTrait::new(0);
            state = state.update_with(item.item_id);
            state = state.update_with(temp_owner);
            let item_hash = state.finalize();

            assert(self.temp.entry(item_hash).read().is_zero(), UNCLAIMED);

            self.temp_owners.entry(item_hash).entry(temp_owner).write(item_id);
            self.temp.entry(item_hash).write(temp_owner);

            self.emit(OwnershipCode { ownership_code: item_hash, temp_owner });
        }

        fn get_temp_owner(self: @ContractState, item_hash: felt252) -> ContractAddress {
            self.temp.entry(item_hash).read()
        }

        fn new_owner_claim_ownership(ref self: ContractState, item_hash: felt252) {
            let claimer = get_caller_address();

            address_zero_check(claimer);
            is_registered(@self, claimer);

            assert(
                self.temp.entry(item_hash).read() == claimer, INCONSISTENT_CLAIMER,
            ); //very important check

            let item = self
                .items
                .entry(self.temp_owners.entry(item_hash).entry(claimer).read())
                .read();

            assert(!item.owner.is_zero(), INVALID);

            let old_owner = item.owner;

            let mut new_item = item;
            new_item.owner = claimer; //changing the owner

            let mut is_part = false;
            let mut length = self.number_of_items.entry(claimer).read();

            for i in 0..length {
                let item_id = self.my_items.entry(claimer).entry(i).read();
                if item_id == new_item.item_id {
                    is_part = true;
                    break;
                }
            }

            if !is_part {
                self.my_items.entry(claimer).entry(length).write(new_item.item_id);
                self.number_of_items.entry(claimer).write(length + 1);
            }

            self.items.entry(item.item_id).write(new_item); //saving the new item with the new owner
            self.temp_owners.entry(item_hash).entry(claimer).write(0);
            self.temp.entry(item_hash).write(0x0.try_into().unwrap());

            self.emit(OwnershipClaimed { new_owner: claimer, old_owner });
        }


        fn owner_revoke_code(ref self: ContractState, item_hash: felt252) {
            let caller = get_caller_address();

            let temp_owner = self.temp.entry(item_hash).read();
            let item = self
                .items
                .entry(self.temp_owners.entry(item_hash).entry(temp_owner).read())
                .read();

            assert!(!item.owner.is_zero(), "{:?} DOES_NOT_EXIST", item_hash);
            assert(item.owner == caller, ONLY_OWNER);

            self.temp_owners.entry(item_hash).entry(temp_owner).write(0);
            self.temp.entry(item_hash).write(0x0.try_into().unwrap());

            self.emit(CodeRevoked { item_hash });
        }


        fn verify_ownership(self: @ContractState, item_id: felt252) -> Owner {
            let item = self.get_item(item_id); //address zero check is done in this function call

            Owner {
                name: item.name,
                item_id,
                username: self.usernames.entry(item.owner).read(),
                owner: item.owner,
            }
        }

        fn is_owner(self: @ContractState, user: ContractAddress, item_id: felt252) -> bool {
            let item = self.get_item(item_id);

            item.owner == user
        }
    }


    fn is_registered(self: @ContractState, address: ContractAddress) {
        let username = self.usernames.entry(address).read();
        assert!(
            !username.is_zero() && self.users.entry(username).read().is_registered,
            "{:?} not registered",
            address,
        );
    }
}

