import {
  constants,
  ContractAddress,
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
    { name: "unique_id", type: "felt" },
    { name: "serial", type: "felt" },
    { name: "date", type: "u128" },
    { name: "owner", type: "ContractAddress" },
    // {name: "metadata", type: "felt*"},
  ],
};

export interface Certificate {
  name: string;
  unique_id: string;
  serial: string;
  date: string;
  owner: ContractAddress;
  // metadata: string[]
}

function getDomain(): StarknetDomain {
  return {
    name: "Authenticity",
    version: shortString.encodeShortString("1"),
    chainId: constants.StarknetChainId.SN_SEPOLIA,
    revision: TypedDataRevision.ACTIVE,
  };
}

export function getCertificateTypedDataHash(certificate: Certificate): string {
  console.log("Inside Cert: ", certificate);
  return typedData.getMessageHash(getTypedData(certificate), certificate.owner);
}

// Needed to reproduce the same structure as:
// https://github.com/0xs34n/starknet.js/blob/1a63522ef71eed2ff70f82a886e503adc32d4df9/__mocks__/typedDataStructArrayExample.json
function getTypedData(certificate: Certificate): TypedData {
  return {
    types,
    primaryType: "Certificate",
    domain: getDomain(),
    message: {
      name: certificate.name,
      unique_id: certificate.unique_id,
      serial: certificate.serial,
      date: certificate.date,
      owner: certificate.owner,
      // metadata: certificate.metadata
    },
  };
}
