import {constants, hash, shortString} from "starknet";

export function getTypedData(certificate, owner) {

    const metadata = certificate.metadata
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => shortString.encodeShortString(item));

    let state = 0n;

    for (const item of metadata) {
        state = hash.computePoseidonHash(state, shortString.encodeShortString(item));
        console.log("state: ", state);
    }

    return {
        types: {
            StarkNetDomain: [
                {name: "name", type: "felt"},
                {name: "version", type: "felt"},
                {name: "chainId", type: "felt"},
            ],
            Certificate: [
                {
                    name: "name",
                    type: "felt",
                },
                {
                    name: "uniqueId",
                    type: "felt",
                },
                {
                    name: "serial",
                    type: "felt",
                },
                {
                    name: "date",
                    type: "u64",
                },
                {
                    name: "owner",
                    type: "ContractAddress",
                },
                {
                    name: "metadata",
                    type: "felt",
                },

            ],
        },
        primaryType: "Certificate",
        domain: {
            name: shortString.encodeShortString("Authenticity"),
            version: shortString.encodeShortString("1.0.2"),
            chainId: shortString.encodeShortString(constants.StarknetChainId.SN_SEPOLIA),
        },
        message: {
            name: shortString.encodeShortString(certificate.name),
            uniqueId: shortString.encodeShortString(certificate.unique_id),
            serial: shortString.encodeShortString(certificate.serial),
            date: certificate.date,
            owner: owner,
            metadata: state,
        },
    };
}


// Verify signing account matches owner
// console.log("Signing Account:", account.address.startsWith("0x0")
//     ? account.address
//     : "0x0" + account.address.slice(2));