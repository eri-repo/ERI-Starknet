pub mod UtilityFunctions {
    use core::hash::{HashStateExTrait, HashStateTrait};
    use core::pedersen::PedersenTrait;
    use starknet::ContractAddress;
    use crate::errors::EriErrors::ZERO_ADDRESS;
    use crate::models::Models::Item;

    pub fn hash_array(data: Span<felt252>) -> felt252 {
        let mut state = PedersenTrait::new(0);

        for i in 0..data.len() {
            state = state.update_with(*data.at(i));
        }

        state.finalize()
    }

    pub fn deleted_item() -> Item {
        Item {
            item_id: 0,
            owner: 0x0.try_into().unwrap(),
            name: 0,
            date: 0,
            manufacturer: 0,
            serial: 0,
            metadata_hash: 0,
        }
    }

    pub fn address_zero_check(address: ContractAddress) {
        assert(address != 0x0.try_into().unwrap(), ZERO_ADDRESS);
    }
}
