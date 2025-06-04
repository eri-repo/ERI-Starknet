export const ABI = [
    {
      "type": "impl",
      "name": "Authenticity",
      "interface_name": "eri::interfaces::IAuthenticity"
    },
    {
      "type": "enum",
      "name": "core::bool",
      "variants": [
        { "name": "False", "type": "()" },
        { "name": "True", "type": "()" }
      ]
    },
    {
      "type": "struct",
      "name": "eri::utilities::Models::Manufacturer",
      "members": [
        {
          "name": "manufacturer_address",
          "type": "core::starknet::contract_address::ContractAddress"
        },
        { "name": "manufacturer_name", "type": "core::felt252" },
        { "name": "is_registered", "type": "core::bool" },
        { "name": "registered_at", "type": "core::integer::u64" }
      ]
    },
    {
      "type": "struct",
      "name": "core::array::Span::<core::felt252>",
      "members": [
        { "name": "snapshot", "type": "@core::array::Array::<core::felt252>" }
      ]
    },
    {
      "type": "struct",
      "name": "eri::utilities::Models::Certificate",
      "members": [
        { "name": "name", "type": "core::felt252" },
        { "name": "unique_id", "type": "core::felt252" },
        { "name": "serial", "type": "core::felt252" },
        { "name": "date", "type": "core::integer::u64" },
        {
          "name": "owner",
          "type": "core::starknet::contract_address::ContractAddress"
        },
        { "name": "metadata", "type": "core::array::Span::<core::felt252>" }
      ]
    },
    {
      "type": "interface",
      "name": "eri::interfaces::IAuthenticity",
      "items": [
        {
          "type": "function",
          "name": "manufacturer_registers",
          "inputs": [{ "name": "manufacturer_name", "type": "core::felt252" }],
          "outputs": [],
          "state_mutability": "external"
        },
        {
          "type": "function",
          "name": "get_manufacturer_address_by_name",
          "inputs": [{ "name": "manufacturer_name", "type": "core::felt252" }],
          "outputs": [
            { "type": "core::starknet::contract_address::ContractAddress" }
          ],
          "state_mutability": "view"
        },
        {
          "type": "function",
          "name": "get_manufacturer",
          "inputs": [
            {
              "name": "user_address",
              "type": "core::starknet::contract_address::ContractAddress"
            }
          ],
          "outputs": [{ "type": "eri::utilities::Models::Manufacturer" }],
          "state_mutability": "view"
        },
        {
          "type": "function",
          "name": "get_manufacturer_address",
          "inputs": [
            {
              "name": "expected_manufacturer",
              "type": "core::starknet::contract_address::ContractAddress"
            }
          ],
          "outputs": [
            { "type": "core::starknet::contract_address::ContractAddress" }
          ],
          "state_mutability": "view"
        },
        {
          "type": "function",
          "name": "user_claim_ownership",
          "inputs": [
            {
              "name": "certificate",
              "type": "eri::utilities::Models::Certificate"
            }
          ],
          "outputs": [],
          "state_mutability": "external"
        }
      ]
    },
    {
      "type": "constructor",
      "name": "constructor",
      "inputs": [
        {
          "name": "ownership_addr",
          "type": "core::starknet::contract_address::ContractAddress"
        },
        {
          "name": "owner_addr",
          "type": "core::starknet::contract_address::ContractAddress"
        }
      ]
    },
    {
      "type": "event",
      "name": "eri::events::EriEvents::ManufacturerRegistered",
      "kind": "struct",
      "members": [
        {
          "name": "manufacturer_address",
          "type": "core::starknet::contract_address::ContractAddress",
          "kind": "key"
        },
        { "name": "manufacturer_name", "type": "core::felt252", "kind": "data" }
      ]
    },
    {
      "type": "event",
      "name": "eri::authenticity::Authenticity::Event",
      "kind": "enum",
      "variants": [
        {
          "name": "ManufacturerRegistered",
          "type": "eri::events::EriEvents::ManufacturerRegistered",
          "kind": "nested"
        }
      ]
    }
  ];