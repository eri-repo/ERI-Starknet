import {ec, hash, shortString} from "starknet";


async function generateSignature() {
    const privateKey = "0xYOUR_PRIVATE_KEY"; // Replace with manufacturer’s private key
    const certificate = {
        name: "PhoneX",
        unique_id: "123",
        serial: "XYZ",
        date: "1697059200",
        owner: "0x0509b4397cc9c1cf56f74cb3e418cfcb29bfae5eaea1ec3ce58e95f4ef8c358a",
        metadata: ["color:black", "storage:128GB"],
    };

    // Compute message hash (mimics contract logic)
    let state = hash.computePedersenHash("0", shortString.encodeShortString(certificate.name));
    state = hash.pedersen(
        state,
        shortString.encodeShortString(certificate.unique_id)
    );
    state = hash.pedersen(
        state,
        shortString.encodeShortString(certificate.serial)
    );
    state = hash.pedersen(state, certificate.date);
    state = hash.pedersen(state, certificate.owner);
    const metadataArray = certificate.metadata.map((item) =>
        shortString.encodeShortString(item)
    );
    const metadataHash = hash.computeHashOnElements(metadataArray);
    state = hash.pedersen(state, metadataHash);
    const messageHash = state;

    // Sign
    const keyPair = ec.getKeyPair(privateKey);
    const signature = ec.sign(keyPair, messageHash);

    console.log("Signature:", {r: signature[0], s: signature[1]});
}

generateSignature();
