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