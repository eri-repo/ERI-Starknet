// use starknet::{ContractAddress, contract_address_const, get_block_timestamp};
// use starknet::testing::{set_caller_address, set_block_timestamp};
// use array::ArrayTrait;
// use core::hash::{HashStateExTrait, HashStateTrait};
// use core::pedersen::PedersenTrait;
// use super::Ownership::*;
// // use super::Ownership::{ContractState, Event, ContractCreated, UserRegistered, ItemCreated, OwnershipCode, OwnershipClaimed, CodeRevoked};
// use crate::::Models::{Certificate, Item, Owner, UserProfile};
// use crate::errors::EriErrors::*;

// const ADDRESS_ZERO: ContractAddress = 0x0.try_into().unwrap();
// const OWNER: ContractAddress = 0x1.try_into().unwrap();
// const USER1: ContractAddress = 0x2.try_into().unwrap();
// const USER2: ContractAddress = 0x3.try_into().unwrap();

// fn create_certificate(unique_id: felt252, owner: ContractAddress) -> Certificate {
//     let mut metadata = ArrayTrait::new();
//     metadata.append('meta1');
//     Certificate {
//         unique_id,
//         name: 'Test Item',
//         date: 123456789,
//         metadata,
//         serial: '123',
//         owner
//     }
// }

// fn setup_contract() -> ContractState {
//     let mut state = Ownership::contract_state_for_testing();
//     set_caller_address(OWNER);
//     Ownership::constructor(ref state, OWNER);
//     state
// }

// #[test]
// fn test_constructor() {
//     let state = setup_contract();
//     assert(state.owner.read() == OWNER, 'Owner not set correctly');
//     // Note: Event emission testing requires external tools like starknet-foundry
// }

// #[test]
// #[should_panic(expected: ('ZERO_ADDRESS',))]
// fn test_constructor_zero_address() {
//     let mut state = Ownership::contract_state_for_testing();
//     Ownership::constructor(ref state, ADDRESS_ZERO);
// }

// #[test]
// fn test_user_registers() {
//     let mut state = setup_contract();
//     set_caller_address(USER1);
//     Ownership::user_registers(ref state, 'alice');

//     let user = state.users.entry('alice').read();
//     assert(user.user_address == USER1, 'User address incorrect');
//     assert(user.username == 'alice', 'Username incorrect');
//     assert(user.is_registered, 'User not registered');
//     assert(user.registered_at == get_block_timestamp(), 'Timestamp incorrect');
//     assert(state.usernames.entry(USER1).read() == 'alice', 'Username mapping incorrect');
// }

// #[test]
// #[should_panic(expected: ('ZERO_ADDRESS',))]
// fn test_user_registers_zero_address() {
//     let mut state = setup_contract();
//     set_caller_address(ADDRESS_ZERO);
//     Ownership::user_registers(ref state, 'alice');
// }

// #[test]
// #[should_panic(expected: ('INVALID_NAME',))]
// fn test_user_registers_empty_username() {
//     let mut state = setup_contract();
//     set_caller_address(USER1);
//     Ownership::user_registers(ref state, 0);
// }

// #[test]
// #[should_panic(expected: ('NAME_NOT_AVAILABLE',))]
// fn test_user_registers_duplicate_username() {
//     let mut state = setup_contract();
//     set_caller_address(USER1);
//     Ownership::user_registers(ref state, 'alice');
//     set_caller_address(USER2);
//     Ownership::user_registers(ref state, 'alice');
// }

// #[test]
// #[should_panic(expected: ('ALREADY_REGISTERED',))]
// fn test_user_registers_duplicate_address() {
//     let mut state = setup_contract();
//     set_caller_address(USER1);
//     Ownership::user_registers(ref state, 'alice');
//     Ownership::user_registers(ref state, 'bob');
// }

// #[test]
// fn test_get_user() {
//     let mut state = setup_contract();
//     set_caller_address(USER1);
//     Ownership::user_registers(ref state, 'alice');
//     let user = Ownership::get_user(@state, USER1);
//     assert(user.username == 'alice', 'Get user failed');
// }

// #[test]
// #[should_panic(expected: ('DOES_NOT_EXIST',))]
// fn test_get_user_nonexistent() {
//     let state = setup_contract();
//     Ownership::get_user(@state, USER1);
// }

// #[test]
// #[should_panic(expected: ('ZERO_ADDRESS',))]
// fn test_get_user_zero_address() {
//     let state = setup_contract();
//     Ownership::get_user(@state, ADDRESS_ZERO);
// }

// #[test]
// fn test_create_item() {
//     let mut state = setup_contract();
//     set_caller_address(USER1);
//     Ownership::user_registers(ref state, 'alice');
//     let certificate = create_certificate('item1', USER1);
//     Ownership::create_item(ref state, USER1, certificate, 'Manufacturer');

//     let item = state.items.entry('item1').read();
//     assert(item.item_id == 'item1', 'Item ID incorrect');
//     assert(item.owner == USER1, 'Owner incorrect');
//     assert(item.name == 'Test Item', 'Name incorrect');
//     assert(item.manufacturer == 'Manufacturer', 'Manufacturer incorrect');
//     assert(state.my_items.entry(USER1).entry(0).read() == 'item1', 'My items incorrect');
//     assert(state.number_of_items.entry(USER1).read() == 1, 'Item count incorrect');
// }

// #[test]
// #[should_panic(expected: ('ZERO_ADDRESS',))]
// fn test_create_item_zero_caller() {
//     let mut state = setup_contract();
//     set_caller_address(ADDRESS_ZERO);
//     let certificate = create_certificate('item1', USER1);
//     Ownership::create_item(ref state, USER1, certificate, 'Manufacturer');
// }

// #[test]
// #[should_panic(expected: ('not registered',))]
// fn test_create_item_unregistered() {
//     let mut state = setup_contract();
//     set_caller_address(USER1);
//     let certificate = create_certificate('item1', USER1);
//     Ownership::create_item(ref state, USER1, certificate, 'Manufacturer');
// }

// #[test]
// #[should_panic(expected: ('INVALID_ID',))]
// fn test_create_item_invalid_id() {
//     let mut state = setup_contract();
//     set_caller_address(USER1);
//     Ownership::user_registers(ref state, 'alice');
//     let certificate = create_certificate(0, USER1);
//     Ownership::create_item(ref state, USER1, certificate, 'Manufacturer');
// }

// #[test]
// #[should_panic(expected: ('ALREADY_OWNED',))]
// fn test_create_item_duplicate_id() {
//     let mut state = setup_contract();
//     set_caller_address(USER1);
//     Ownership::user_registers(ref state, 'alice');
//     let certificate = create_certificate('item1', USER1);
//     Ownership::create_item(ref state, USER1, certificate, 'Manufacturer');
//     Ownership::create_item(ref state, USER1, certificate, 'Manufacturer');
// }

// #[test]
// fn test_get_item_by_id() {
//     let mut state = setup_contract();
//     set_caller_address(USER1);
//     Ownership::user_registers(ref state, 'alice');
//     let certificate = create_certificate('item1', USER1);
//     Ownership::create_item(ref state, USER1, certificate, 'Manufacturer');
//     let item = Ownership::get_item_by_id(@state, 'item1');
//     assert(item.item_id == 'item1', 'Get item failed');
// }

// #[test]
// #[should_panic(expected: ('DOES_NOT_EXIST',))]
// fn test_get_item_by_id_nonexistent() {
//     let state = setup_contract();
//     Ownership::get_item_by_id(@state, 'item1');
// }

// #[test]
// fn test_get_all_items_for() {
//     let mut state = setup_contract();
//     set_caller_address(USER1);
//     Ownership::user_registers(ref state, 'alice');
//     let certificate1 = create_certificate('item1', USER1);
//     let certificate2 = create_certificate('item2', USER1);
//     Ownership::create_item(ref state, USER1, certificate1, 'Manufacturer');
//     Ownership::create_item(ref state, USER1, certificate2, 'Manufacturer');
//     let items = Ownership::get_all_items_for(@state, USER1);
//     assert(items.len() == 2, 'Incorrect item count');
//     assert(*items.at(0).item_id == 'item1', 'Item 1 incorrect');
//     assert(*items.at(1).item_id == 'item2', 'Item 2 incorrect');
// }

// #[test]
// fn test_get_all_items_for_empty() {
//     let mut state = setup_contract();
//     set_caller_address(USER1);
//     Ownership::user_registers(ref state, 'alice');
//     let items = Ownership::get_all_items_for(@state, USER1);
//     assert(items.len() == 0, 'Should return empty array');
// }

// #[test]
// #[should_panic(expected: ('ZERO_ADDRESS',))]
// fn test_get_all_items_for_zero_address() {
//     let state = setup_contract();
//     Ownership::get_all_items_for(@state, ADDRESS_ZERO);
// }

// #[test]
// #[should_panic(expected: ('DOES_NOT_EXIST',))]
// fn test_get_all_items_for_unregistered() {
//     let state = setup_contract();
//     Ownership::get_all_items_for(@state, USER1);
// }

// #[test]
// fn test_generate_change_of_ownership_code() {
//     let mut state = setup_contract();
//     set_caller_address(USER1);
//     Ownership::user_registers(ref state, 'alice');
//     set_caller_address(USER2);
//     Ownership::user_registers(ref state, 'bob');
//     set_caller_address(USER1);
//     let certificate = create_certificate('item1', USER1);
//     Ownership::create_item(ref state, USER1, certificate, 'Manufacturer');

//     Ownership::generate_change_of_ownership_code(ref state, 'item1', USER2);
//     let mut hash_state = PedersenTrait::new(0);
//     hash_state = hash_state.update_with('item1');
//     hash_state = hash_state.update_with(USER2);
//     let item_hash = hash_state.finalize();

//     assert(state.temp.entry(item_hash).read() == USER2, 'Temp owner incorrect');
//     assert(state.temp_owners.entry(item_hash).entry(USER2).read() == 'item1', 'Temp item ID incorrect');
// }

// #[test]
// #[should_panic(expected: ('ONLY_OWNER',))]
// fn test_generate_change_of_ownership_code_not_owner() {
//     let mut state = setup_contract();
//     set_caller_address(USER1);
//     Ownership::user_registers(ref state, 'alice');
//     set_caller_address(USER2);
//     Ownership::user_registers(ref state, 'bob');
//     let certificate = create_certificate('item1', USER1);
//     Ownership::create_item(ref state, USER1, certificate, 'Manufacturer');
//     Ownership::generate_change_of_ownership_code(ref state, 'item1', USER2);
// }

// #[test]
// #[should_panic(expected: ('UNCLAIMED',))]
// fn test_generate_change_of_ownership_code_already_pending() {
//     let mut state = setup_contract();
//     set_caller_address(USER1);
//     Ownership::user_registers(ref state, 'alice');
//     set_caller_address(USER2);
//     Ownership::user_registers(ref state, 'bob');
//     set_caller_address(USER1);
//     let certificate = create_certificate('item1', USER1);
//     Ownership::create_item(ref state, USER1, certificate, 'Manufacturer');
//     Ownership::generate_change_of_ownership_code(ref state, 'item1', USER2);
//     Ownership::generate_change_of_ownership_code(ref state, 'item1', USER2);
// }

// #[test]
// fn test_new_owner_claim_ownership() {
//     let mut state = setup_contract();
//     set_caller_address(USER1);
//     Ownership::user_registers(ref state, 'alice');
//     set_caller_address(USER2);
//     Ownership::user_registers(ref state, 'bob');
//     set_caller_address(USER1);
//     let certificate = create_certificate('item1', USER1);
//     Ownership::create_item(ref state, USER1, certificate, 'Manufacturer');
//     Ownership::generate_change_of_ownership_code(ref state, 'item1', USER2);

//     let mut hash_state = PedersenTrait::new(0);
//     hash_state = hash_state.update_with('item1');
//     hash_state = hash_state.update_with(USER2);
//     let item_hash = hash_state.finalize();

//     set_caller_address(USER2);
//     Ownership::new_owner_claim_ownership(ref state, item_hash);

//     let item = state.items.entry('item1').read();
//     assert(item.owner == USER2, 'Ownership not transferred');
//     assert(state.number_of_items.entry(USER2).read() == 1, 'Item count incorrect');
//     assert(state.temp.entry(item_hash).read() == ADDRESS_ZERO, 'Temp owner not cleared');
// }

// #[test]
// #[should_panic(expected: ('INCONSISTENT_CLAIMER',))]
// fn test_new_owner_claim_ownership_unauthorized() {
//     let mut state = setup_contract();
//     set_caller_address(USER1);
//     Ownership::user_registers(ref state, 'alice');
//     set_caller_address(USER2);
//     Ownership::user_registers(ref state, 'bob');
//     set_caller_address(USER1);
//     let certificate = create_certificate('item1', USER1);
//     Ownership::create_item(ref state, USER1, certificate, 'Manufacturer');
//     Ownership::generate_change_of_ownership_code(ref state, 'item1', USER2);

//     let mut hash_state = PedersenTrait::new(0);
//     hash_state = hash_state.update_with('item1');
//     hash_state = hash_state.update_with(USER2);
//     let item_hash = hash_state.finalize();

//     set_caller_address(OWNER);
//     Ownership::new_owner_claim_ownership(ref state, item_hash);
// }

// #[test]
// fn test_owner_revoke_code() {
//     let mut state = setup_contract();
//     set_caller_address(USER1);
//     Ownership::user_registers(ref state, 'alice');
//     set_caller_address(USER2);
//     Ownership::user_registers(ref state, 'bob');
//     set_caller_address(USER1);
//     let certificate = create_certificate('item1', USER1);
//     Ownership::create_item(ref state, USER1, certificate, 'Manufacturer');
//     Ownership::generate_change_of_ownership_code(ref state, 'item1', USER2);

//     let mut hash_state = PedersenTrait::new(0);
//     hash_state = hash_state.update_with('item1');
//     hash_state = hash_state.update_with(USER2);
//     let item_hash = hash_state.finalize();

//     Ownership::owner_revoke_code(ref state, item_hash);
//     assert(state.temp.entry(item_hash).read() == ADDRESS_ZERO, 'Temp owner not cleared');
//     assert(state.temp_owners.entry(item_hash).entry(USER2).read() == 0, 'Temp item ID not cleared');
// }

// #[test]
// #[should_panic(expected: ('ONLY_OWNER',))]
// fn test_owner_revoke_code_not_owner() {
//     let mut state = setup_contract();
//     set_caller_address(USER1);
//     Ownership::user_registers(ref state, 'alice');
//     set_caller_address(USER2);
//     Ownership::user_registers(ref state, 'bob');
//     set_caller_address(USER1);
//     let certificate = create_certificate('item1', USER1);
//     Ownership::create_item(ref state, USER1, certificate, 'Manufacturer');
//     Ownership::generate_change_of_ownership_code(ref state, 'item1', USER2);

//     let mut hash_state = PedersenTrait::new(0);
//     hash_state = hash_state.update_with('item1');
//     hash_state = hash_state.update_with(USER2);
//     let item_hash = hash_state.finalize();

//     set_caller_address(USER2);
//     Ownership::owner_revoke_code(ref state, item_hash);
// }

// #[test]
// fn test_verify_ownership() {
//     let mut state = setup_contract();
//     set_caller_address(USER1);
//     Ownership::user_registers(ref state, 'alice');
//     let certificate = create_certificate('item1', USER1);
//     Ownership::create_item(ref state, USER1, certificate, 'Manufacturer');
//     let owner = Ownership::verify_ownership(@state, 'item1');
//     assert(owner.owner == USER1, 'Owner incorrect');
//     assert(owner.username == 'alice', 'Username incorrect');
// }

// #[test]
// fn test_is_owner() {
//     let mut state = setup_contract();
//     set_caller_address(USER1);
//     Ownership::user_registers(ref state, 'alice');
//     let certificate = create_certificate('item1', USER1);
//     Ownership::create_item(ref state, USER1, certificate, 'Manufacturer');
//     assert(Ownership::is_owner(@state, USER1, 'item1'), 'Should be owner');
//     assert(!Ownership::is_owner(@state, USER2, 'item1'), 'Should not be owner');
// }

// #[test]
// fn test_i_own() {
//     let mut state = setup_contract();
//     set_caller_address(USER1);
//     Ownership::user_registers(ref state, 'alice');
//     let certificate = create_certificate('item1', USER1);
//     Ownership::create_item(ref state, USER1, certificate, 'Manufacturer');
//     assert(Ownership::i_own(@state, 'item1'), 'Should own item');
//     set_caller_address(USER2);
//     assert(!Ownership::i_own(@state, 'item1'), 'Should not own item');
// }