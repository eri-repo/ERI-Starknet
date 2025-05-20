


pub mod Events {

    use starknet::ContractAddress;

    #[derive(Drop, starknet::Event)]
    pub struct ManufacturerRegistered {
        #[key]
        pub manufacturer_address: ContractAddress,
        pub username: felt252,
    }


    // // Events must derive the `starknet::Event` trait
    // #[derive(Copy, Drop, Debug, PartialEq, starknet::Event)]
    // pub struct CounterIncreased {
    //     pub amount: u128,
    // }

    // #[derive(Copy, Drop, Debug, PartialEq, starknet::Event)]
    // pub struct UserIncreaseCounter {
    //     // The `#[key]` attribute indicates that this event will be indexed.
    //     // You can also use `#[flat]` for nested structs.
    //     #[key]
    //     pub user: starknet::ContractAddress,
    //     pub new_value: u128,
    // }
}
