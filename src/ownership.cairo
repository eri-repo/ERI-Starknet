#[starknet::contract]
mod Ownership {
    use core::hash::{HashStateExTrait, HashStateTrait};
    use core::pedersen::PedersenTrait;
    use starknet::storage::{
        Map, StoragePathEntry, StoragePointerReadAccess, StoragePointerWriteAccess
    };
    use starknet::{ContractAddress, get_block_timestamp, get_caller_address, get_contract_address};
    use crate::errors::Errors::*;
    use crate::events::Events::*;
    use crate::iauthenticity::IOwnership;
    use crate::models::Models::{Certificate, Item, Owner, UserProfile, hash_array};

    #[storage]
    struct Storage {
        owner: ContractAddress,
        users: Map<felt252, UserProfile>, // username -> UserProfile
        usernames: Map<ContractAddress, felt252>, // user_address -> username
        owners: Map<felt252, ContractAddress>, // item_id -> owner
        owned_items: Map<ContractAddress, Map<felt252, Item>>, // (user, item_id) -> Item
        my_items: Map<ContractAddress, Map<u32, Item>>, // (user, index) -> Item
        my_items_length: Map<ContractAddress, u32>, // user -> item count
        temp: Map<felt252, ContractAddress>, // item_hash -> temp_owner
        temp_owners: Map<felt252, Map<ContractAddress, Item>> // (item_hash, temp_owner) -> Item
    }

    // Define zero address constant
    const ADDRESS_ZERO: ContractAddress = 0x0.try_into().unwrap();

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
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        assert(owner != ADDRESS_ZERO, ZERO_ADDRESS);
        self.owner.write(owner);

        self.emit(ContractCreated { contract_address: get_contract_address(), owner });
    }

    #[abi(embed_v0)]
    impl Ownership of IOwnership<ContractState> {
        fn user_registers(ref self: ContractState, username: felt252) {
            let caller = get_caller_address();

            assert(caller != ADDRESS_ZERO, 'Caller cannot be zero address');
            assert(username != 0, 'Username cannot be empty');
            assert(
                self.users.entry(username).read().user_address == ADDRESS_ZERO,
                'Username already taken',
            );
            assert(self.usernames.entry(caller).read() == 0, 'Address already registered');

            let user = UserProfile {
                user_address: caller,
                username,
                is_registered: true,
                registered_at: get_block_timestamp(),
            };

            self.users.entry(username).write(user);
            self.usernames.entry(caller).write(username);
            self.emit(UserRegistered { user_address: caller, username });
        }

        fn get_user(self: @ContractState, user_address: ContractAddress) -> UserProfile {
            assert(user_address != ADDRESS_ZERO, 'Invalid address');
            let username = self.usernames.entry(user_address).read();
            assert(username != 0, 'User does not exist');
            self.users.entry(username).read()
        }

        fn create_item(
            ref self: ContractState,
            caller: ContractAddress,
            certificate: Certificate,
            manufacturer_name: felt252,
        ) {
            assert(caller != ADDRESS_ZERO, 'Caller cannot be zero address');
            assert(get_caller_address() != ADDRESS_ZERO, ZERO_ADDRESS);
            let username = self.usernames.entry(caller).read();
            assert(username != 0, 'Caller not registered');
            let item_id = certificate.unique_id;
            assert(item_id != 0, 'Invalid item ID');
            assert(self.owners.entry(item_id).read() == ADDRESS_ZERO, 'Item already owned');

            let item = Item {
                item_id,
                owner: caller,
                name: certificate.name,
                date: certificate.date,
                manufacturer: manufacturer_name,
                serial: certificate.serial,
                metadata_hash: hash_array(certificate.metadata),
            };

            self.owned_items.entry(caller).entry(item_id).write(item.clone());
            self.owners.entry(item_id).write(caller);
            let index = self.my_items_length.entry(caller).read();
            self.my_items.entry(caller).entry(index).write(item);
            self.my_items_length.entry(caller).write(index + 1);
            self.emit(ItemCreated { item_id, owner: caller });
        }

        fn get_all_items_for(self: @ContractState, user: ContractAddress) -> Array<Item> {
            assert(user != ADDRESS_ZERO, 'Invalid address');
            let username = self.usernames.entry(user).read();
            assert(username != 0, 'User does not exist');
            let mut items = ArrayTrait::new();
            let length = self.my_items_length.entry(user).read();
            let mut i = 0;

            while i < length {
                let item = self.my_items.entry(user).entry(i).read();
                if item.owner != ADDRESS_ZERO {
                    items.append(item);
                }
                i += 1;
            }

            // loop {
            //     if i >= length {
            //         break;
            //     }
            //     let item = self.my_items.read((user, i));
            //     if item.owner != ADDRESS_ZERO {
            //         items.append(item);
            //     }
            //     i += 1;
            // }
            items
        }

        fn generate_change_of_ownership_code(
            ref self: ContractState, item_id: felt252, temp_owner: ContractAddress,
        ) -> felt252 {
            let caller = get_caller_address();
            assert(caller != ADDRESS_ZERO, 'Caller cannot be zero address');
            assert(temp_owner != ADDRESS_ZERO, ZERO_ADDRESS);
            assert(caller == self.owners.entry(item_id).read(), 'Caller is not owner');
            assert(self.usernames.entry(caller).read() != 0, 'Caller not registered');
            assert(temp_owner != caller, 'Cannot generate for yourself');

            let item = self.owned_items.entry(caller).entry(item_id).read();
            assert(item.owner != ADDRESS_ZERO, 'Item does not exist');

            let mut state = PedersenTrait::new(0);
            state = state.update_with(item.item_id);
            state = state.update_with(temp_owner);
            let item_hash = state.finalize();

            assert(self.temp.entry(item_hash).read() == ADDRESS_ZERO, 'Item not claimed yet');

            self.temp_owners.entry(item_hash).entry(temp_owner).write(item);
            self.temp.entry(item_hash).write(temp_owner);
            self.emit(OwnershipCode { ownership_code: item_hash, temp_owner });
            item_hash
        }

        fn new_owner_claim_ownership(ref self: ContractState, item_hash: felt252) {
            let new_owner = get_caller_address();
            assert(new_owner != ADDRESS_ZERO, 'Caller cannot be zero address');
            assert(self.usernames.entry(new_owner).read() != 0, 'Caller not registered');
            let temp_owner = self.temp.entry(item_hash).read();
            assert(temp_owner == new_owner, 'Unauthorized claimant');
            let item = self.temp_owners.entry(item_hash).entry(new_owner).read();
            assert(item.owner != ADDRESS_ZERO, 'Invalid item hash');

            let old_owner = item.owner;
            let item_id = item.item_id;

            let mut new_item = item;
            new_item.owner = new_owner;

            self.owned_items.entry(old_owner).entry(item_id).write(item);
            self.owned_items.entry(new_owner).entry(item_id).write(new_item);
            self.owners.entry(item_id).write(new_owner);

            let mut is_part = false;
            let length = self.my_items_length.entry(new_owner).read();
            let mut i = 0;

            while i < length {
                if self.my_items.entry(new_owner).entry(i).read().item_id == item_id {
                    is_part = true;
                    break;
                }
                i += 1;
            }

            // loop {
            //     if i >= length {
            //         break;
            //     }
            //     if self.my_items.read((new_owner, i)).item_id == item_id {
            //         is_part = true;
            //         break;
            //     }
            //     i += 1;
            // }
            if !is_part {
                self.my_items.entry(new_owner).entry(length).write(new_item);
                self.my_items_length.entry(new_owner).write(length + 1);
            }

            self.temp_owners.entry(item_hash).entry(new_owner).write(item);
            //     Item {
            //         item_id: 0,
            //         owner: ADDRESS_ZERO,
            //         name: 0,
            //         date: 0,
            //         manufacturer: 0,
            //         metadata: 0,
            //         serial: 0,
            //     },
            // );
            self.temp.entry(item_hash).write(ADDRESS_ZERO);
            self.emit(OwnershipClaimed { new_owner, old_owner });
        }

        fn get_temp_owner(self: @ContractState, item_hash: felt252) -> ContractAddress {
            self.temp.entry(item_hash).read()
        }

        fn owner_revoke_code(ref self: ContractState, item_hash: felt252) {
            let caller = get_caller_address();
            assert(caller != ADDRESS_ZERO, 'Caller cannot be zero address');
            assert(self.usernames.entry(caller).read() != 0, 'Caller not registered');
            let temp_owner = self.temp.entry(item_hash).read();
            let item = self.temp_owners.entry(item_hash).entry(temp_owner).read();
            assert(item.owner != ADDRESS_ZERO, 'Item does not exist');
            assert(item.owner == caller, 'Caller is not owner');

            self.temp_owners.entry(item_hash).entry(temp_owner).write(item);

            //     Item {
            //         item_id: 0,
            //         owner: ADDRESS_ZERO,
            //         name: 0,
            //         date: 0,
            //         manufacturer: 0,
            //         metadata: 0,
            //         serial: 0,
            //     },
            // );
            self.temp.entry(item_hash).write(ADDRESS_ZERO);
            self.emit(CodeRevoked { item_hash });
        }

        fn get_item(self: @ContractState, item_id: felt252) -> Item {
            let owner = self.owners.entry(item_id).read();
            assert(owner != ADDRESS_ZERO, 'Item does not exist');
            self.owned_items.entry(owner).entry(item_id).read()
        }

        fn verify_ownership(self: @ContractState, item_id: felt252) -> Owner {
            let item = self.get_item(item_id);
            Owner {
                name: item.name,
                item_id,
                username: self.usernames.entry(item.owner).read(),
                owner: item.owner,
            }
        }

        fn is_owner(self: @ContractState, user: ContractAddress, item_id: felt252) -> bool {
            self.owned_items.entry(user).entry(item_id).read().owner == user
        }

        fn i_own(self: @ContractState, item_id: felt252) -> bool {
            let caller = get_caller_address();
            self.owned_items.entry(caller).entry(item_id).read().owner == caller
        }
    }
}

