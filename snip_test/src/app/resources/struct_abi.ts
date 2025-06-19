export const STRUCT_ABI = [
  {
    type: "impl",
    name: "Authenticity",
    interface_name: "eri::interfaces::IAuthenticity",
  },
  {
    type: "enum",
    name: "core::bool",
    variants: [
      { name: "False", type: "()" },
      { name: "True", type: "()" },
    ],
  },
  {
    type: "struct",
    name: "eri::models::Models::Manufacturer",
    members: [
      {
        name: "manufacturer_address",
        type: "core::starknet::contract_address::ContractAddress",
      },
      { name: "manufacturer_name", type: "core::felt252" },
      { name: "is_registered", type: "core::bool" },
      { name: "registered_at", type: "core::integer::u64" },
    ],
  },
  {
    type: "struct",
    name: "core::array::Span::<core::felt252>",
    members: [
      { name: "snapshot", type: "@core::array::Array::<core::felt252>" },
    ],
  },
  {
    type: "struct",
    name: "eri::certificate::Cert::Certificate",
    members: [
      { name: "name", type: "core::felt252" },
      { name: "id", type: "core::felt252" },
      { name: "serial", type: "core::felt252" },
      { name: "date", type: "core::integer::u128" },
      {
        name: "owner",
        type: "core::starknet::contract_address::ContractAddress",
      },
      { name: "metadata", type: "core::array::Span::<core::felt252>" },
    ],
  },
  {
    type: "interface",
    name: "eri::interfaces::IAuthenticity",
    items: [
      {
        type: "function",
        name: "manufacturer_registers",
        inputs: [{ name: "manufacturer_name", type: "core::felt252" }],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "get_manufacturer_address_by_name",
        inputs: [{ name: "manufacturer_name", type: "core::felt252" }],
        outputs: [
          { type: "core::starknet::contract_address::ContractAddress" },
        ],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "get_manufacturer",
        inputs: [
          {
            name: "user_address",
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        outputs: [{ type: "eri::models::Models::Manufacturer" }],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "get_manufacturer_address",
        inputs: [
          {
            name: "expected_manufacturer",
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        outputs: [
          { type: "core::starknet::contract_address::ContractAddress" },
        ],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "verify_signature",
        inputs: [
          {
            name: "certificate",
            type: "eri::certificate::Cert::Certificate",
          },
          { name: "signature", type: "core::felt252" },
        ],
        outputs: [{ type: "core::bool" }],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "user_claim_ownership",
        inputs: [
          {
            name: "certificate",
            type: "eri::certificate::Cert::Certificate",
          },
          { name: "signature", type: "core::felt252" },
        ],
        outputs: [],
        state_mutability: "external",
      },
    ],
  },
  {
    type: "constructor",
    name: "constructor",
    inputs: [
      {
        name: "ownership",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        name: "owner",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
  },
  {
    type: "event",
    name: "eri::events::EriEvents::ManufacturerRegistered",
    kind: "struct",
    members: [
      {
        name: "manufacturer_address",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "key",
      },
      { name: "manufacturer_name", type: "core::felt252", kind: "data" },
    ],
  },
  {
    type: "event",
    name: "eri::events::EriEvents::ContractCreated",
    kind: "struct",
    members: [
      {
        name: "contract_address",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "data",
      },
      {
        name: "owner",
        type: "core::starknet::contract_address::ContractAddress",
        kind: "data",
      },
    ],
  },
  {
    type: "event",
    name: "eri::authenticity::Authenticity::Event",
    kind: "enum",
    variants: [
      {
        name: "ManufacturerRegistered",
        type: "eri::events::EriEvents::ManufacturerRegistered",
        kind: "nested",
      },
      {
        name: "ContractCreated",
        type: "eri::events::EriEvents::ContractCreated",
        kind: "nested",
      },
    ],
  },
];
