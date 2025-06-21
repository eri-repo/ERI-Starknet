import {
  constants,
  shortString,
  StarknetDomain,
  TypedData,
  typedData,
  TypedDataRevision,
} from "starknet";

const types = {
  StarknetDomain: [
    { name: "name", type: "shortstring" },
    { name: "version", type: "shortstring" },
    { name: "chainId", type: "shortstring" },
    { name: "revision", type: "shortstring" },
  ],
  // In V1 we privilege user friendly names
  Certificate: [
    { name: "name", type: "felt" },
    { name: "id", type: "felt" },
    { name: "serial", type: "felt" },
    { name: "date", type: "u128" },
    { name: "owner", type: "ContractAddress" },
    { name: "metadata", type: "felt*" },
  ],
};

export interface Certificate {
  name: string;
  id: string;
  serial: string;
  date: string;
  owner: string;
  metadata: string[];
}

//   id: string;
//   serial: string;
//   date: string;

function getDomain(): StarknetDomain {
  return {
    name: "CustomERC20",
    version: shortString.encodeShortString("1"),
    chainId: constants.StarknetChainId.SN_SEPOLIA,
    revision: TypedDataRevision.ACTIVE,
  };
}

export function getTypedDataHash(myStruct: Certificate, owner: bigint): string {
  console.log("Inside Certificate: ", myStruct);
  return typedData.getMessageHash(getTypedData(myStruct), owner);
}

// Needed to reproduce the same structure as:
// https://github.com/0xs34n/starknet.js/blob/1a63522ef71eed2ff70f82a886e503adc32d4df9/__mocks__/typedDataStructArrayExample.json
export function getTypedData(myStruct: Certificate): TypedData {
  return {
    types,
    primaryType: "Certificate",
    domain: getDomain(),
    message: {
      name: myStruct.name,
      id: myStruct.id,
      serial: myStruct.serial,
      date: myStruct.date,
      owner: myStruct.owner,
      metadata: myStruct.metadata,
    },
  };
}

//   id: myStruct.id,
//   serial: myStruct.serial,
//   date: myStruct.date,
