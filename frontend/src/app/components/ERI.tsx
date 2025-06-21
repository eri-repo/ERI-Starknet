"use client";

import React, {ReactNode, useEffect, useState} from "react";
import {
    AccountInterface,
    Contract,
    ContractAddress,
    ProviderInterface,
    RpcProvider,
    typedData
} from "starknet";
import {connect, disconnect} from "starknetkit";
import {toast, ToastContainer} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {Certificate} from "../resources/interfaces";
import {ContractType, felt252ToString, hex_it, stringToFelt252} from "../resources/utilities";
import {getTypedData} from "@/app/resources/certificateData";
import {QRCodeCanvas} from "qrcode.react";


// Placeholder types for imported utilities (adjust based on actual implementations)
type GetTypedData = (cert: Partial<Certificate>, owner: string) => any;
type ConvertFelt252ToString = (felt: string | bigint) => string;
type HexIt = (value: string) => string;
type CheckConnection = (address: string | null) => boolean;

const App: React.FC = () => {
    // Shared state
    const [provider, setProvider] = useState<ProviderInterface | null>(null);
    const [account, setAccount] = useState<AccountInterface | null>(null);
    const [address, setAddress] = useState<ContractAddress | null>(null);
    const [queryAddress, setQueryAddress] = useState<string>("");
    const [queryName, setQueryName] = useState<string>("");
    const [formVisible, setFormVisible] = useState<string>("");
    const [certificate, setCertificate] = useState({
        name: "",
        unique_id: "",
        serial: "",
        date: "",
        owner: "",
        metadata: "",
    });

    // Authenticity state
    const [manufacturerDetails, setManufacturerDetails] = useState<string>("");
    const [manufacturerAddress1, setManufacturerAddress1] = useState<string>("");
    const [manufacturerAddress2, setManufacturerAddress2] = useState<string>("");
    const [signatureResult, setSignatureResult] = useState<string>("");
    const [qrCodeData, setQrCodeData] = useState<string>("");
    const [signature, setSignature] = useState<string>("");

    // Ownership state
    const [queryItemId, setQueryItemId] = useState<string>("");
    const [queryItemHash, setQueryItemHash] = useState<string>("");
    const [userDetails, setUserDetails] = useState("");
    const [itemDetails, setItemDetails] = useState<string>("");
    const [itemsList, setItemsList] = useState([]);
    const [tempOwnerAddress, setTempOwnerAddress] = useState<string>("");
    const [ownershipDetails, setOwnershipDetails] = useState<string>("");
    const [isOwnerResult, setIsOwnerResult] = useState<string>("");


    const OWNERSHIP_ADDRESS: ContractAddress = process.env.NEXT_PUBLIC_OWNERSHIP_ADDRESS!;
    const AUTHENTICITY_ADDRESS: ContractAddress = process.env.NEXT_PUBLIC_AUTHENTICITY_ADDRESS!;

    const PROVIDER = new RpcProvider({
        nodeUrl: process.env.NEXT_PUBLIC_SEPOLIA_URL
    });

    useEffect(() => {
        // Auto-connect wallet on load
        connectWallet();
    }, []);

    const connectWallet = async (): Promise<void> => {
        if (address) {
            await disconnect();
            setProvider(PROVIDER);
            setAccount(null);
            setAddress(null);
            toast.success("Wallet disconnected");
            return;
        }
        try {
            const {wallet} = await connect({
                provider: PROVIDER
            });
            if (wallet && wallet.isConnected) {
                setProvider(wallet.provider);
                setAccount(wallet.account);
                setAddress(wallet.selectedAddress);
                toast.success(`Connected: ${wallet.selectedAddress!.slice(0, 10)}...`);
            } else {
                toast.error("Failed to connect wallet");
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error";
            toast.error(`Error: ${message}`);
        }
    };

    // @ts-ignore
    const getContract = async (contractAddress: ContractAddress, contractType: ContractType): Promise<Contract> => {

        console.log("using get contract");

        try {
            const {abi} = await provider!.getClassAt(contractAddress);
            if (!abi) {
                throw new Error("No ABI found for the contract.");
            }

            if (contractType === ContractType.VIEW) {
                if (!address) {
                    toast.error("Connect wallet!");
                    // @ts-ignore
                    return;
                }
                return new Contract(abi, contractAddress, provider!);
            } else if (contractType === ContractType.STATE_CHANGE) {
                if (!address || !account) {
                    toast.error("Account not initialized");
                    // @ts-ignore
                    return;
                }
                return new Contract(abi, contractAddress, account!);
            }

        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to initialize contract at ${contractAddress}: ${error.message}`);
            } else {
                throw new Error(`Failed to initialize contract at ${contractAddress}: Unknown error`);
            }
        }
    };

    //===================AUTHENTICITY FUNCTIONS===================

    const registerManufacturer = async (): Promise<void> => {

        try {
            const contract: Contract = await getContract(AUTHENTICITY_ADDRESS, ContractType.STATE_CHANGE);

            const res = await contract.manufacturer_registers(
                stringToFelt252(queryName)
            );
            const txHash: string = res?.transaction_hash;
            const txResult = await provider!.waitForTransaction(txHash);
            const events = contract.parseEvents(txResult);

            const manuAddress =
                events[0]["eri::events::EriEvents::ManufacturerRegistered"].manufacturer_address;

            const manuName =
                events[0]["eri::events::EriEvents::ManufacturerRegistered"].manufacturer_name;

            toast.success(
                `Manufacturer ${felt252ToString(manuName.toString())} 
                with Address ${hex_it(manuAddress.toString())} registered`
            );
            setQueryName("");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error";
            toast.error(`Error: ${message}`);
        }
    };

    const getManufacturer = async (): Promise<void> => {

        try {
            const contract = await getContract(AUTHENTICITY_ADDRESS, ContractType.VIEW);

            const result = await contract.get_manufacturer(queryAddress);

            setManufacturerDetails(result);
            setQueryAddress("")
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error";
            toast.error(`Error: ${message}`);
        }
    };

    const getManufacturerAddressByName = async (): Promise<void> => {

        try {
            const contract = await getContract(AUTHENTICITY_ADDRESS, ContractType.VIEW);

            const result: string = await contract.get_manufacturer_address_by_name(
                stringToFelt252(queryName)
            );

            setManufacturerAddress1(hex_it(result));
            setQueryName("")
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error";
            toast.error(`Error: ${message}`);
        }
    };

    const getManufacturerAddress = async (): Promise<void> => {

        try {
            const contract = await getContract(AUTHENTICITY_ADDRESS, ContractType.VIEW);

            const result: string = await contract.get_manufacturer_address(queryAddress);

            setManufacturerAddress2(hex_it(result));
            setQueryAddress("");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error";
            toast.error(`Error: ${message}`);
        }
    };

    const signAndVerifySignatureOffChain = async (): Promise<void> => {

        try {

            const contract = await getContract(AUTHENTICITY_ADDRESS, ContractType.VIEW);

            certificate.date = Math.floor(Date.now() / 1000).toString();

            const cert: Certificate = {
                name: certificate.name,
                id: certificate.unique_id,
                serial: certificate.serial,
                date: certificate.date,
                owner: address!, //this is important because this is the signer of the message
                metadata: certificate.metadata
                    .split(",")
                    .map((item: string) => item.trim())
                    .filter(Boolean),
            };

            console.log("Certificate Struct:", cert);

            //sign message off-chain
            // const msgHash = getTypedDataHash(cert, address);

            const certTypedData = getTypedData(cert);
            //sign message off-chain
            const msgHash = typedData.getMessageHash(certTypedData, address!);
            console.log("Message Hash:", msgHash);


            //TODO: THIS IS UNNECESSARY AND WILL REMOVE IT LATER
            //sign the typedData off-chain
            const signature = await account!.signMessage(certTypedData);
            console.log("Signature:", signature);

            //verify the signature off-chain
            const isValid: boolean = await provider.verifyMessageInStarknet(
                msgHash, //certTypedData,
                signature,
                address
            );

            console.log("Off-chain verification: ", isValid);
            //TODO============================================================


            //verify signature on-chain
            const result: boolean = await contract.verify_signature(cert, msgHash);

            if (!result) {
                throw new Error("Signature verification failed!")
            }

            setSignatureResult(`Verification result is: ${result}`);

            // Generate QR code data
            const qrData = JSON.stringify({
                cert,
                msgHash,
            });
            console.log("QR Code Struct:", qrData);
            setQrCodeData(qrData);

            console.log("On-chain verification:", result);
            toast.success(`Signature verification is: ${result ? "True" : "False"}`);

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error";
            toast.error(`Error: ${message}`);
        }
    }

    const claimOwnership = async (): Promise<void> => {

        try {
            const contract = await getContract(AUTHENTICITY_ADDRESS, ContractType.STATE_CHANGE);

            const cert: Certificate = {
                name: certificate.name,
                id: certificate.unique_id,
                serial: certificate.serial,
                date: certificate.date,
                owner: certificate.owner,
                metadata: certificate.metadata
                    .split(",")
                    .map((item: string) => item.trim())
                    .filter(Boolean),
            };

            const res = await contract.user_claim_ownership(cert, signature);

            const txHash: string = res?.transaction_hash;
            const txResult = await provider!.waitForTransaction(txHash);

            const events = contract.parseEvents(txResult);

            console.log("Events: ", events);

            toast.success(`${cert.id} claimed successfully`);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error";
            toast.error(`Error: ${message}`);
        }
    };

    //===================OWNERSHIP FUNCTIONS===================

    const registerUser = async (): Promise<void> => {

        try {
            const contract = await getContract(OWNERSHIP_ADDRESS, ContractType.STATE_CHANGE);

            const res = await contract.user_registers(
                stringToFelt252(queryName.toLowerCase().trim())
            );

            const txHash: string = res?.transaction_hash;
            const txResult = await provider!.waitForTransaction(txHash);
            const events = contract.parseEvents(txResult);

            const userAddress =
                events[0]["eri::events::EriEvents::UserRegistered"].user_address;
            const userName =
                events[0]["eri::events::EriEvents::UserRegistered"].username;

            toast.success(
                `${felt252ToString(userName.toString())} with 
                address ${hex_it(userAddress.toString())} registered`
            );
            setQueryName("");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error";
            toast.error(`Error: ${message}`);
        }
    };
    const setAuthenticity = async (): Promise<void> => {

        try {
            const contract = await getContract(OWNERSHIP_ADDRESS, ContractType.STATE_CHANGE);

            const res = await contract.set_authenticity_contract(queryAddress);

            const txHash: string = res?.transaction_hash;
            const txResult = await provider!.waitForTransaction(txHash);
            const events = contract.parseEvents(txResult);

            const authenticity_contract =
                events[0]["eri::events::EriEvents::AuthenticitySet"].authenticity_address;

            toast.success(
                `${hex_it(authenticity_contract.toString())} is registered`
            );
            setQueryAddress("");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error";
            toast.error(`Error: ${message}`);
        }
    };

    const getUser = async (): Promise<void> => {

        try {
            const contract = await getContract(OWNERSHIP_ADDRESS, ContractType.VIEW);

            const result = await contract.get_user(queryAddress);

            setUserDetails(result);

            setQueryAddress("")
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error";
            toast.error(`Error: ${message}`);
        }
    };

    const getItem = async (): Promise<void> => {

        try {
            const contract = await getContract(OWNERSHIP_ADDRESS, ContractType.VIEW);

            const result = await contract.get_item(
                stringToFelt252(queryItemId)
            );

            setItemDetails(result);
            setQueryItemId("")
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error";
            toast.error(`Error: ${message}`);
        }
    };

    const getAllMyItems = async (): Promise<void> => {

        try { //todo: I really need to find a way to make sure only the owner of the items can call this function and get the items
            const contract = await getContract(OWNERSHIP_ADDRESS, ContractType.STATE_CHANGE);

            const result: any[] = await contract.get_all_my_items(queryAddress);

            let items = result.map((item) => ({
                item_id: felt252ToString(item.item_id),
                name: felt252ToString(item.name),
                owner: hex_it(item.owner),
                serial: felt252ToString(item.serial),
                manufacturer: felt252ToString(item.manufacturer),
                date: new Date(Number(item.date) * 1000).toLocaleString(),
                metadata_hash: hex_it(item.metadata_hash),
            }));

            setItemsList(items);

            setQueryAddress("");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error";
            toast.error(`Error: ${message}`);
        }
    };

    const generateChangeOfOwnershipCode = async (): Promise<void> => {

        try {
            const contract = await getContract(OWNERSHIP_ADDRESS, ContractType.STATE_CHANGE);

            const res = await contract.generate_change_of_ownership_code(
                stringToFelt252(queryItemId),
                queryAddress
            );

            const txHash: string = res?.transaction_hash;
            const txResult = await provider!.waitForTransaction(txHash);
            const events = contract.parseEvents(txResult);

            console.log("Events: ", events);

            const ownershipCode =
                events[0]["eri::events::EriEvents::OwnershipCode"].ownership_code;
            const temp =
                events[0]["eri::events::EriEvents::OwnershipCode"].temp_owner;

            toast.success(
                `Code ${hex_it(ownershipCode)} generated
                 for ${hex_it(temp.toString())}`
            );

            setQueryItemId("");
            setQueryAddress("");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error";
            toast.error(`Error: ${message}`);
        }
    };

    const getTempOwner = async (): Promise<void> => {

        try {
            const contract = await getContract(OWNERSHIP_ADDRESS, ContractType.VIEW);

            const itHash = queryItemHash.startsWith("0x")
                ? queryItemHash
                : "0x" + queryItemHash;

            const result: string = await contract.get_temp_owner(itHash);
            console.log("temp owner", result);

            setTempOwnerAddress(hex_it(result));

            setQueryItemHash("")
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error";
            toast.error(`Error: ${message}`);
        }
    };

    const newOwnerClaimOwnership = async (): Promise<void> => {

        try {
            const contract = await getContract(OWNERSHIP_ADDRESS, ContractType.STATE_CHANGE);

            const feltItemHash: string = queryItemHash.startsWith("0x")
                ? queryItemHash
                : "0x" + queryItemHash;

            const res = await contract.new_owner_claim_ownership(feltItemHash);
            const txHash: string = res?.transaction_hash;
            const txResult = await provider!.waitForTransaction(txHash);
            const events = contract.parseEvents(txResult);

            const newOwn =
                events[0]["eri::events::EriEvents::OwnershipClaimed"].new_owner;
            const oldOwn =
                events[0]["eri::events::EriEvents::OwnershipClaimed"].old_owner;

            toast.success(
                `${hex_it(newOwn.toString())} claimed ownership 
                from ${hex_it(oldOwn.toString())}`
            );
            setQueryItemHash("");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error";
            toast.error(`Error: ${message}`);
        }
    };

    const revokeCode = async (): Promise<void> => {

        try {
            const contract = await getContract(OWNERSHIP_ADDRESS, ContractType.STATE_CHANGE);

            const feltItemHash: string = queryItemHash.startsWith("0x")
                ? queryItemHash
                : "0x" + queryItemHash;

            const res = await contract.owner_revoke_code(feltItemHash);
            const txHash: string = res?.transaction_hash;
            const txResult = await provider!.waitForTransaction(txHash);
            const events = contract.parseEvents(txResult);

            const item_hash =
                events[0]["eri::events::EriEvents::CodeRevoked"].item_hash;

            toast.success(`${hex_it(item_hash.toString())} revoked successfully`);
            setQueryItemHash("");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error";
            toast.error(`Error: ${message}`);
        }
    };

    const verifyOwnership = async (): Promise<void> => {

        try {
            const contract = await getContract(OWNERSHIP_ADDRESS, ContractType.VIEW);

            const result = await contract.verify_ownership(
                stringToFelt252(queryItemId)
            );

            setOwnershipDetails(result);
            setQueryItemId("")
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error";
            toast.error(`Error: ${message}`);
        }
    };

    const checkIsOwner = async (): Promise<void> => {

        try {
            const contract = await getContract(OWNERSHIP_ADDRESS, ContractType.VIEW);
            const result: boolean = await contract.is_owner(
                queryAddress,
                stringToFelt252(queryItemId)
            );

            toast.success(`Is Owner: ${result}`);

            setIsOwnerResult(`Is Owner: ${result}`);

            setQueryAddress("");
            setQueryItemId("")
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error";
            toast.error(`Error: ${message}`);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-100 to-teal-100">
            <header className="p-4 bg-blue-600 text-white shadow-md">
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-bold">ERI STARKNET</h1>
                    <button
                        onClick={connectWallet}
                        className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 transform hover:scale-105"
                        aria-label={address ? "Disconnect Wallet" : "Connect Wallet"}
                    >
                        {address ? `${address.slice(0, 6)}...${address.slice(60)}` : "Connect Wallet"}
                    </button>
                </div>
            </header>

            <main className="container mx-auto p-6 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h2 className="text-xl font-semibold mb-4 text-blue-800">
                            Authenticity Operations
                        </h2>
                        <div className="space-y-4">
                            {[
                                {
                                    id: "registerManufacturer",
                                    label: "Register Manufacturer",
                                    form: (
                                        <form
                                            onSubmit={(e: React.FormEvent) => {
                                                e.preventDefault();
                                                registerManufacturer();
                                            }}
                                            className="space-y-4"
                                        >
                                            <input
                                                type="text"
                                                placeholder="Manufacturer Name"
                                                value={queryName}
                                                onChange={(e) => setQueryName(e.target.value)}
                                                className="w-full p-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                type="submit"
                                                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
                                            >
                                                Submit
                                            </button>
                                        </form>
                                    ),
                                },
                                {
                                    id: "getManufacturer",
                                    label: "Get Manufacturer",
                                    form: (
                                        <form
                                            onSubmit={(e: React.FormEvent) => {
                                                e.preventDefault();
                                                getManufacturer();
                                            }}
                                            className="space-y-4"
                                        >
                                            <input
                                                type="text"
                                                placeholder="Manufacturer Address"
                                                value={queryAddress}
                                                onChange={(e) => setQueryAddress(e.target.value)}
                                                className="w-full p-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                type="submit"
                                                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
                                            >
                                                Submit
                                            </button>

                                            {manufacturerDetails &&
                                                <ul className="space-y-2">{
                                                    <li className="bg-gray-50 p-3 text-black rounded-lg">
                                                        <p> Name: {felt252ToString(manufacturerDetails.manufacturer_name)}</p>
                                                        <p> Address: {" "}{hex_it(manufacturerDetails.manufacturer_address)}</p>
                                                        <p> isRegistered: {manufacturerDetails.is_registered.toString()}</p>
                                                        <p> RegisteredAt: {new Date(Number(manufacturerDetails.registered_at) * 1000).toLocaleString()}</p>
                                                    </li>
                                                }
                                                </ul>
                                            }

                                        </form>
                                    ),
                                },
                                {
                                    id: "getManufacturerAddressByName",
                                    label: "Get Address by Name",
                                    form: (
                                        <form
                                            onSubmit={(e: React.FormEvent) => {
                                                e.preventDefault();
                                                getManufacturerAddressByName();
                                            }}
                                            className="space-y-4"
                                        >
                                            <input
                                                type="text"
                                                placeholder="Manufacturer Name"
                                                value={queryName}
                                                onChange={(e) => setQueryName(e.target.value)}
                                                className="w-full p-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                type="submit"
                                                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
                                            >
                                                Submit
                                            </button>
                                            {manufacturerAddress1 && (
                                                <p className="mt-2 text-gray-700">
                                                    {manufacturerAddress1}
                                                </p>
                                            )}
                                        </form>
                                    ),
                                },
                                {
                                    id: "getManufacturerAddress",
                                    label: "Get Manufacturer Address",
                                    form: (
                                        <form
                                            onSubmit={(e: React.FormEvent) => {
                                                e.preventDefault();
                                                getManufacturerAddress();
                                            }}
                                            className="space-y-4"
                                        >
                                            <input
                                                type="text"
                                                placeholder="Manufacturer Address"
                                                value={queryAddress}
                                                onChange={(e) => setQueryAddress(e.target.value)}
                                                className="w-full p-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                type="submit"
                                                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
                                            >
                                                Submit
                                            </button>
                                            {manufacturerAddress2 && (
                                                <p className="mt-2 text-gray-700">
                                                    {manufacturerAddress2}
                                                </p>
                                            )}
                                        </form>
                                    ),
                                },
                                {
                                    id: "verifySignature",
                                    label: "Verify Signature",
                                    form: (
                                        <form
                                            onSubmit={(e: React.FormEvent) => {
                                                e.preventDefault();
                                                signAndVerifySignatureOffChain();
                                            }}
                                            className="space-y-4"
                                        >
                                            <input
                                                type="text"
                                                placeholder="Certificate Name"
                                                value={certificate.name}
                                                onChange={(e) =>
                                                    setCertificate({
                                                        ...certificate,
                                                        name: e.target.value,
                                                    })
                                                }
                                                className="w-full p-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Unique ID"
                                                value={certificate.unique_id}
                                                onChange={(e) =>
                                                    setCertificate({
                                                        ...certificate,
                                                        unique_id: e.target.value,
                                                    })
                                                }
                                                className="w-full p-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Serial"
                                                value={certificate.serial}
                                                onChange={(e) =>
                                                    setCertificate({
                                                        ...certificate,
                                                        serial: e.target.value,
                                                    })
                                                }
                                                className="w-full p-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Metadata (comma separated)"
                                                value={certificate.metadata}
                                                onChange={(e) =>
                                                    setCertificate({
                                                        ...certificate,
                                                        metadata: e.target.value,
                                                    })
                                                }
                                                className="w-full p-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                type="submit"
                                                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
                                            >
                                                Submit
                                            </button>
                                            {signatureResult && (
                                                <p className="mt-2 text-gray-700">{signatureResult}</p>
                                            )}

                                            {qrCodeData && (
                                                <div className="mt-4 flex flex-col items-center">
                                                    <h3 className="text-lg font-semibold text-blue-800">Certificate QR
                                                        Code</h3>
                                                    <QRCodeCanvas
                                                        value={qrCodeData}
                                                        size={350}
                                                        fgColor="#1e3a8a" // Dark blue (matches blue-900)
                                                        bgColor="#e0f2fe" // Light blue (matches sky-100)
                                                        level="M"
                                                        className="rounded-lg border border-gray-200 p-2"
                                                        imageSettings={{
                                                            src: "/logo.png", // Logo in public/
                                                            x: undefined, // Center horizontally
                                                            y: undefined, // Center vertically
                                                            height: 50,
                                                            width: 50,
                                                            excavate: true, // Remove QR code behind logo
                                                        }}
                                                    />
                                                    <p className="mt-2 text-sm text-gray-600">Scan to verify your
                                                        product authenticity</p>
                                                </div>
                                            )}
                                            <button
                                                onClick={() => {
                                                    const canvas = document.querySelector("canvas");
                                                    const link = document.createElement("a");
                                                    link.href = canvas.toDataURL("image/png");
                                                    link.download = `certificate-qr-${certificate.unique_id || "unknown"}.png`;
                                                    link.click();
                                                }}
                                                className="mt-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-3 rounded-lg transition duration-300"
                                            >
                                                Download QR Code
                                            </button>

                                        </form>
                                    ),
                                },
                                {
                                    id: "claimOwnership",
                                    label: "Claim Ownership",
                                    form: (
                                        <form
                                            onSubmit={(e: React.FormEvent) => {
                                                e.preventDefault();
                                                claimOwnership();
                                            }}
                                            className="space-y-4"
                                        >
                                            <input
                                                type="text"
                                                placeholder="Certificate Name"
                                                value={certificate.name}
                                                onChange={(e) =>
                                                    setCertificate({
                                                        ...certificate,
                                                        name: e.target.value,
                                                    })
                                                }
                                                className="w-full p-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Unique ID"
                                                value={certificate.unique_id}
                                                onChange={(e) =>
                                                    setCertificate({
                                                        ...certificate,
                                                        unique_id: e.target.value,
                                                    })
                                                }
                                                className="w-full p-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Serial"
                                                value={certificate.serial}
                                                onChange={(e) =>
                                                    setCertificate({
                                                        ...certificate,
                                                        serial: e.target.value,
                                                    })
                                                }
                                                className="w-full p-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <input
                                                type="number"
                                                placeholder="Date (Unix timestamp)"
                                                value={certificate.date}
                                                onChange={(e) =>
                                                    setCertificate({
                                                        ...certificate,
                                                        date: e.target.value,
                                                    })
                                                }
                                                className="w-full p-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Owner Address"
                                                value={certificate.owner}
                                                onChange={(e) =>
                                                    setCertificate({
                                                        ...certificate,
                                                        owner: e.target.value,
                                                    })
                                                }
                                                className="w-full p-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Metadata (comma-separated)"
                                                value={certificate.metadata}
                                                onChange={(e) =>
                                                    setCertificate({
                                                        ...certificate,
                                                        metadata: e.target.value,
                                                    })
                                                }
                                                className="w-full p-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Signature (0x...)"
                                                value={signature}
                                                onChange={(e) => setSignature(e.target.value)}
                                                className="w-full p-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                type="submit"
                                                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
                                            >
                                                Submit
                                            </button>
                                        </form>
                                    ),
                                },
                            ].map(({id, label, form}) => (
                                <div key={id}>
                                    <button
                                        onClick={() => setFormVisible(formVisible === id ? "" : id)}
                                        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 flex justify-between items-center"
                                    >
                                        <span>{label}</span>
                                    </button>
                                    <div
                                        className={`transition-all duration-300 ${
                                            formVisible === id
                                                ? "max-h-screen mt-4"
                                                : "max-h-0 overflow-hidden"
                                        }`}
                                    >
                                        {form}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h2 className="text-xl font-semibold mb-4 text-blue-800">
                            Ownership Operations
                        </h2>
                        <div className="space-y-4">
                            {[
                                {
                                    id: "registerUser",
                                    label: "Register User",
                                    form: (
                                        <form
                                            onSubmit={(e: React.FormEvent) => {
                                                e.preventDefault();
                                                registerUser();
                                            }}
                                            className="space-y-4"
                                        >
                                            <input
                                                type="text"
                                                placeholder="Username"
                                                value={queryName}
                                                onChange={(e) => setQueryName(e.target.value)}
                                                className="w-full p-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                type="submit"
                                                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
                                            >
                                                Submit
                                            </button>
                                        </form>
                                    ),
                                },
                                {
                                    id: "setAuthenticity",
                                    label: "Owner Sets Authenticity Contract",
                                    form: (
                                        <form
                                            onSubmit={(e: React.FormEvent) => {
                                                e.preventDefault();
                                                setAuthenticity();
                                            }}
                                            className="space-y-4"
                                        >
                                            <input
                                                type="text"
                                                placeholder="Authenticity Contract Address"
                                                value={queryAddress}
                                                onChange={(e) => setQueryAddress(e.target.value)}
                                                className="w-full p-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                type="submit"
                                                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
                                            >
                                                Submit
                                            </button>
                                        </form>
                                    ),
                                },
                                {
                                    id: "getUser",
                                    label: "Get User",
                                    form: (
                                        <form
                                            onSubmit={(e: React.FormEvent) => {
                                                e.preventDefault();
                                                getUser();
                                            }}
                                            className="space-y-4"
                                        >
                                            <input
                                                type="text"
                                                placeholder="User Address"
                                                value={queryAddress}
                                                onChange={(e) => setQueryAddress(e.target.value)}
                                                className="w-full p-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                type="submit"
                                                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
                                            >
                                                Submit
                                            </button>

                                            {userDetails &&
                                                <ul className="space-y-2">{
                                                    <li className="bg-gray-50 p-3 text-black rounded-lg">
                                                        <p>Address: {" "}{hex_it(userDetails.user_address)}</p>
                                                        <p> Name: {felt252ToString(userDetails.username)}</p>
                                                        <p> isRegistered: {userDetails.is_registered.toString()}</p>
                                                        <p> RegisteredAt: {new Date(Number(userDetails.registered_at) * 1000).toLocaleString()}</p>
                                                    </li>
                                                }
                                                </ul>
                                            }
                                        </form>
                                    ),
                                },
                                {
                                    id: "getItem",
                                    label: "Get Item",
                                    form: (
                                        <form
                                            onSubmit={(e: React.FormEvent) => {
                                                e.preventDefault();
                                                getItem();
                                            }}
                                            className="space-y-4"
                                        >
                                            <input
                                                type="text"
                                                placeholder="Item ID"
                                                value={queryItemId}
                                                onChange={(e) => setQueryItemId(e.target.value)}
                                                className="w-full p-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                type="submit"
                                                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
                                            >
                                                Submit
                                            </button>

                                            {itemDetails &&
                                                <ul className="space-y-2">{
                                                    <li className="bg-gray-50 p-3 text-gray-700 rounded-lg overflow-hidden">
                                                        <p>Item Name: {" "}{felt252ToString(itemDetails.name)}</p>
                                                        <p>Item ID: {felt252ToString(itemDetails.item_id)}</p>
                                                        <p>Serial: {" "}{felt252ToString(itemDetails.serial)}</p>
                                                        <p> Owner: {hex_it(itemDetails.owner)}</p>
                                                        <p> Manufacturer: {felt252ToString(itemDetails.manufacturer)}</p>
                                                        <p> Prod
                                                            Date: {new Date(Number(itemDetails.date) * 1000).toLocaleString()}</p>
                                                        <p> Metadata
                                                            Hash: {hex_it(itemDetails.metadata_hash)}</p>
                                                    </li>
                                                }
                                                </ul>
                                            }
                                        </form>
                                    ),
                                },
                                {
                                    id: "getAllMyItems",
                                    label: "Get All Items",
                                    form: (
                                        <form
                                            onSubmit={(e: React.FormEvent) => {
                                                e.preventDefault();
                                                getAllMyItems();
                                            }}
                                            className="space-y-4"
                                        >
                                            <input
                                                type="text"
                                                placeholder="User Address"
                                                value={queryAddress}
                                                onChange={(e) => setQueryAddress(e.target.value)}
                                                className="w-full p-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                type="submit"
                                                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
                                            >
                                                Submit
                                            </button>

                                            {itemsList.length > 0 ? (
                                                <div className="max-h-64 overflow-y-auto">
                                                    <ul className="space-y-2">
                                                        {itemsList.map((itemDetails, i) => (
                                                            <li
                                                                key={i}
                                                                className="bg-gray-50 text-gray-700 p-3 rounded-lg overflow-hidden"
                                                            >
                                                                <div className="grid grid-cols-1 gap-1">
                                                                    <p className="font-semibold">Item {i + 1}</p>
                                                                    <p className="truncate"
                                                                       title={itemDetails.name}>
                                                                        Item Name: {itemDetails.name}
                                                                    </p>
                                                                    <p className="truncate"
                                                                       title={itemDetails.item_id}>
                                                                        Item ID: {itemDetails.item_id}
                                                                    </p>
                                                                    <p className="truncate"
                                                                       title={itemDetails.serial}>
                                                                        Serial: {itemDetails.serial}
                                                                    </p>
                                                                    <p className="truncate"
                                                                       title={itemDetails.owner}>
                                                                        Owner: {itemDetails.owner}
                                                                    </p>
                                                                    <p className="truncate"
                                                                       title={itemDetails.manufacturer}>
                                                                        Manufacturer: {itemDetails.manufacturer}
                                                                    </p>
                                                                    <p>
                                                                        Prod Date: {itemDetails.date}
                                                                    </p>
                                                                    <p className="truncate"
                                                                       title={itemDetails.metadata_hash}>
                                                                        Metadata Hash: {itemDetails.metadata_hash}
                                                                    </p>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ) : (
                                                <p className="text-gray-600 text-center">No items found</p>
                                            )}
                                        </form>
                                    ),
                                },
                                {
                                    id: "getTempOwner",
                                    label: "Get Temp Owner",
                                    form: (
                                        <form
                                            onSubmit={(e: React.FormEvent) => {
                                                e.preventDefault();
                                                getTempOwner();
                                            }}
                                            className="space-y-4"
                                        >
                                            <input
                                                type="text"
                                                placeholder="Item Hash"
                                                value={queryItemHash}
                                                onChange={(e) => setQueryItemHash(e.target.value)}
                                                className="w-full p-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                type="submit"
                                                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
                                            >
                                                Submit
                                            </button>
                                            {tempOwnerAddress ? (
                                                hex_it(tempOwnerAddress) === "0x0" ? (
                                                    <p className="mt-2 text-gray-700 text-center">NO USER FOUND</p>
                                                ) : (
                                                    <p className="mt-2 text-gray-700 truncate" title={tempOwnerAddress}>
                                                        {tempOwnerAddress}
                                                    </p>
                                                )
                                            ) : (
                                                <p className="mt-2 text-gray-700 text-center">NO USER FOUND</p>
                                            )}
                                        </form>
                                    ),
                                },
                                {
                                    id: "verifyOwnership",
                                    label: "Verify Ownership",
                                    form: (
                                        <form
                                            onSubmit={(e: React.FormEvent) => {
                                                e.preventDefault();
                                                verifyOwnership();
                                            }}
                                            className="space-y-4"
                                        >
                                            <input
                                                type="text"
                                                placeholder="Item ID"
                                                value={queryItemId}
                                                onChange={(e) => setQueryItemId(e.target.value)}
                                                className="w-full p-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                type="submit"
                                                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
                                            >
                                                Submit
                                            </button>

                                            {ownershipDetails &&
                                                <ul className="space-y-2">{
                                                    <li className="bg-gray-50 p-3 text-gray-700 rounded-lg">
                                                        <p>Item Name: {" "}{felt252ToString(ownershipDetails.name)}</p>
                                                        <p>Item ID: {" "}{felt252ToString(ownershipDetails.item_id)}</p>
                                                        <p>: Owner
                                                            Name{" "}{felt252ToString(ownershipDetails.username)}</p>
                                                        <p> Owner Address: {hex_it(ownershipDetails.owner)}</p>
                                                    </li>
                                                }
                                                </ul>
                                            }

                                        </form>
                                    ),
                                },
                                {
                                    id: "isOwner",
                                    label: "Is Owner",
                                    form: (
                                        <form
                                            onSubmit={(e: React.FormEvent) => {
                                                e.preventDefault();
                                                checkIsOwner();
                                            }}
                                            className="space-y-4"
                                        >
                                            <input
                                                type="text"
                                                placeholder="User Address"
                                                value={queryAddress}
                                                onChange={(e) => setQueryAddress(e.target.value)}
                                                className="w-full p-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Item ID"
                                                value={queryItemId}
                                                onChange={(e) => setQueryItemId(e.target.value)}
                                                className="w-full p-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                type="submit"
                                                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
                                            >
                                                Submit
                                            </button>
                                            {isOwnerResult && (
                                                <p className="mt-2 text-gray-700">{isOwnerResult}</p>
                                            )}
                                        </form>
                                    ),
                                },
                                {
                                    id: "generateOwnershipCode",
                                    label: "Generate Ownership Code",
                                    form: (
                                        <form
                                            onSubmit={(e: React.FormEvent) => {
                                                e.preventDefault();
                                                generateChangeOfOwnershipCode();
                                            }}
                                            className="space-y-4"
                                        >
                                            <input
                                                type="text"
                                                placeholder="Item ID"
                                                value={queryItemId}
                                                onChange={(e) => setQueryItemId(e.target.value)}
                                                className="w-full p-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Temp Owner Address"
                                                value={queryAddress}
                                                onChange={(e) => setQueryAddress(e.target.value)}
                                                className="w-full p-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                type="submit"
                                                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
                                            >
                                                Submit
                                            </button>
                                        </form>
                                    ),
                                },
                                {
                                    id: "newOwnerClaimOwnership",
                                    label: "New Owner Claim Ownership",
                                    form: (
                                        <form
                                            onSubmit={(e: React.FormEvent) => {
                                                e.preventDefault();
                                                newOwnerClaimOwnership();
                                            }}
                                            className="space-y-4"
                                        >
                                            <input
                                                type="text"
                                                placeholder="Item Hash"
                                                value={queryItemHash}
                                                onChange={(e) => setQueryItemHash(e.target.value)}
                                                className="w-full p-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                type="submit"
                                                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
                                            >
                                                Submit
                                            </button>
                                        </form>
                                    ),
                                },
                                {
                                    id: "revokeCode",
                                    label: "Revoke Code",
                                    form: (
                                        <form
                                            onSubmit={(e: React.FormEvent) => {
                                                e.preventDefault();
                                                revokeCode();
                                            }}
                                            className="space-y-4"
                                        >
                                            <input
                                                type="text"
                                                placeholder="Item Hash"
                                                value={queryItemHash}
                                                onChange={(e) => setQueryItemHash(e.target.value)}
                                                className="w-full p-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                type="submit"
                                                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
                                            >
                                                Submit
                                            </button>
                                        </form>
                                    ),
                                },
                            ].map(({id, label, form}) => (
                                <div key={id}>
                                    <button
                                        onClick={() => setFormVisible(formVisible === id ? "" : id)}
                                        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 flex justify-between items-center"
                                    >
                                        <span>{label}</span>
                                    </button>
                                    <div
                                        className={`transition-all duration-300 ${
                                            formVisible === id
                                                ? "max-h-screen mt-4"
                                                : "max-h-0 overflow-hidden"
                                        }`}
                                    >
                                        {form}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
            />
        </div>
    );
};

export default App;
