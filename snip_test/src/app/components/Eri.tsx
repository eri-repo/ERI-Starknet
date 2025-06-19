"use client";

import React, { useState, useEffect } from "react";
import { Contract, RpcProvider } from "starknet";
import { connect, disconnect /*StarknetWindowObject*/ } from "starknetkit";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { CUSTOMERC_ABI } from "../resources/abi";
import { STRUCT_ABI } from "../resources/struct_abi";
import { getTypedDataHash, Certificate } from "../resources/structType";
import {
  getCertificateTypedDataHash,
  //   Certificate,
} from "../resources/structWithArray";

export default function App() {
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [txt, setTxt] = useState<string>("");
  const [txts, setTxts] = useState<string>("");
  const [num, setNum] = useState<string>("");
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [certificate, setCertificate] = useState({
    name: "iPhone 12",
    unique_id: "POP",
    serial: "12345",
    date: "123456789",
    metadata: "ONE, TWO",
  });

  const PROVIDER = new RpcProvider({
    nodeUrl: process.env.NEXT_PUBLIC_SEPOLIA_URL,
  });
  const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CUSTOMERC20_ADDRESS;

  useEffect(() => {
    // Auto-connect wallet on load
    connectWallet();
  }, []);

  const connectWallet = async () => {
    if (address) {
      await disconnect();
      setProvider(null);
      setAccount(null);
      setAddress(null);
      toast.success("Wallet disconnected");
      return;
    }
    try {
      const { wallet } = await connect({ provider: PROVIDER });
      if (wallet && wallet.isConnected) {
        console.log(`Wallet is connected: ${wallet.isConnected}`);
        setProvider(wallet.provider);
        setAccount(wallet.account);
        setAddress(wallet.selectedAddress);

        toast.success(`Connected: ${wallet.selectedAddress.slice(0, 10)}...`);
      } else {
        toast.error("Failed to connect wallet");
      }
    } catch (error) {
      // @ts-expect-error
      toast.error(`Error: ${error.message}`);
    }
  };

  const checkConnection = (addr: string | null): boolean => {
    if (!addr) {
      toast.error("Connect wallet!");
      return false;
    }
    return true;
  };

  const verifyMessageHash = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkConnection(address)) {
      return;
    }

    try {
      const contract = new Contract(CUSTOMERC_ABI, CONTRACT_ADDRESS, account);

      // const simpleStruct: SimpleStruct = {
      //     name: txt,
      //     num,
      // };

      certificate.owner = address;

      const metadata: string[] = certificate.metadata
        .split(",")
        .map((item: string) => item.trim())
        .filter(Boolean);
      // .map((item: string) => shortString.encodeShortString(item));

      console.log("Metadata: ", metadata);

      const cert: Certificate = {
        name: certificate.name,
        unique_id: certificate.unique_id,
        serial: certificate.serial,
        date: certificate.date,
        owner: certificate.owner,
        // metadata
      };

      // console.log("Simple Struct:", simpleStruct);
      console.log("Certificate:", cert);

      const msgHash = getCertificateTypedDataHash(cert);
      console.log("Message Hash:", msgHash);

      const result: boolean = await contract.verify_signature(cert, msgHash);

      console.log("Result:", result);
      toast.success(`Message hash valid: ${result ? "True" : "False"}`);
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(`Error: ${error.message}`);
    }
  };

  const verifyStructArray = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkConnection(address)) {
      return;
    }

    try {
      const contract = new Contract(STRUCT_ABI, CONTRACT_ADDRESS, account);

      const simpleStruct: Certificate = {
        name: certificate.name,
        id: certificate.unique_id,
        serial: certificate.serial,
        date: certificate.date,
        owner: address,
        metadata: certificate.metadata
          .split(",")
          .map((item: string) => item.trim())
          .filter(Boolean),
      };

      console.log("Simple Struct:", simpleStruct);

      const msgHash = getTypedDataHash(simpleStruct, address);

      console.log("Message Hash:", msgHash);

      const result: boolean = await contract.verify_signature(
        simpleStruct,
        msgHash
      );

      console.log("Result:", result);
      toast.success(`Message hash valid: ${result ? "True" : "False"}`);
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(`Error: ${error.message}`);
    }
  };

  const handleCertificateChange = (field: keyof Certificate, value: string) => {
    setCertificate((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-teal-100 flex flex-col">
      <header className="p-4 bg-blue-600 text-white shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Starknet CustomERC20</h1>
          <button
            onClick={connectWallet}
            className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 transform hover:scale-105"
            aria-label={address ? "Disconnect Wallet" : "Connect Wallet"}
          >
            {address ? `${address.slice(0, 10)}...` : "Connect Wallet"}
          </button>
        </div>
      </header>

      <main className="container mx-auto p-6 flex-grow">
        <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 flex justify-between items-center"
          >
            <span>Verify Certificate</span>
            {/*{isFormOpen ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}*/}
          </button>
          <div
            className={`transition-all duration-300 ${
              isFormOpen ? "max-h-screen mt-4" : "max-h-0 overflow-hidden"
            }`}
          >
            <form onSubmit={verifyStructArray} className="space-y-4">
              <input
                type="text"
                placeholder="Certificate Name"
                value={certificate.name}
                onChange={(e) =>
                  handleCertificateChange("name", e.target.value)
                }
                className="w-full p-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Unique ID"
                value={certificate.unique_id}
                onChange={(e) =>
                  handleCertificateChange("unique_id", e.target.value)
                }
                className="w-full p-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Serial Number"
                value={certificate.serial}
                onChange={(e) =>
                  handleCertificateChange("serial", e.target.value)
                }
                className="w-full p-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Date (Unix timestamp)"
                value={certificate.date}
                onChange={(e) =>
                  handleCertificateChange("date", e.target.value)
                }
                className="w-full p-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Metadata (comma-separated)"
                value={certificate.metadata}
                onChange={(e) =>
                  handleCertificateChange("metadata", e.target.value)
                }
                className="w-full p-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
              >
                Submit
              </button>
            </form>
          </div>
        </div>
        <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 flex justify-between items-center"
          >
            <span>Verify Struct With Array</span>
            {/*{isFormOpen ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}*/}
          </button>
          <div
            className={`transition-all duration-300 ${
              isFormOpen ? "max-h-screen mt-4" : "max-h-0 overflow-hidden"
            }`}
          >
            <form onSubmit={verifyStructArray} className="space-y-4">
              <input
                type="text"
                placeholder="Txt"
                value={txt}
                onChange={(e) => setTxt(e.target.value)}
                className="w-full p-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Arrays (comma-separated)"
                value={txts}
                onChange={(e) => setTxts(e.target.value)}
                className="w-full p-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
              >
                Submit
              </button>
            </form>
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

  // return (
  //     <div className="min-h-screen bg-gradient-to-br from-blue-100 to-teal-100 flex flex-col">
  //         <header className="p-4 bg-blue-600 text-white shadow-md">
  //             <div className="container mx-auto flex justify-between items-center">
  //                 <h1 className="text-2xl font-bold">Starknet CustomERC20</h1>
  //                 <button
  //                     onClick={connectWallet}
  //                     className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 transform hover:scale-105"
  //                     aria-label={address ? "Disconnect Wallet" : "Connect Wallet"}
  //                 >
  //                     {address ? `${address.slice(0, 10)}...` : "Connect Wallet"}
  //                 </button>
  //             </div>
  //         </header>
  //
  //         <main className="container mx-auto p-6 flex-grow">
  //             <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
  //                 <button
  //                     onClick={() => setIsFormOpen(!isFormOpen)}
  //                     className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 flex justify-between items-center"
  //                 >
  //                     <span>Verify Message Hash</span>
  //                     {/*{isFormOpen ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}*/}
  //                 </button>
  //                 <div
  //                     className={`transition-all duration-300 ${isFormOpen ? "max-h-screen mt-4" : "max-h-0 overflow-hidden"}`}
  //                 >
  //                     <form onSubmit={verifyMessageHash} className="space-y-4">
  //                         <input
  //                             type="text"
  //                             placeholder="Txt"
  //                             value={name: txt}
  //                             onChange={(e) => setTxt(e.target.value)}
  //                             className="w-full p-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
  //                         />
  //                         <input
  //                             type="text"
  //                             placeholder="Num"
  //                             value={txts}
  //                             onChange={(e) => setTxts(e.target.value)}
  //                             className="w-full p-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
  //                         />
  //                          <input
  //                             type="text"
  //                             placeholder="Num"
  //                             value={txts}
  //                             onChange={(e) => setTxts(e.target.value)}
  //                             className="w-full p-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
  //                         />
  //                          <input
  //                             type="text"
  //                             placeholder="Num"
  //                             value={txts}
  //                             onChange={(e) => setTxts(e.target.value)}
  //                             className="w-full p-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
  //                         />
  //                          <input
  //                             type="text"
  //                             placeholder="Num"
  //                             value={txts}
  //                             onChange={(e) => setTxts(e.target.value)}
  //                             className="w-full p-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
  //                         />
  //
  //                         <button
  //                             type="submit"
  //                             className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
  //                         >
  //                             Submit
  //                         </button>
  //                     </form>
  //                 </div>
  //             </div>
  //         </main>
  //
  //         <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false}/>
  //     </div>
  // );
}
