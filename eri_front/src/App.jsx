import { useState } from "react";
import "./App.css";
import { Contract, RpcProvider, shortString } from "starknet";
import { getTypedData } from "./assets/typedData.js";
import { ABI } from "./assets/abi";
import BigNumber from "bignumber.js";
import { connect, disconnect } from "starknetkit";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);
  const [address, setAddress] = useState(null);
  const [manufacturerName, setManufacturerName] = useState("");
  const [certificate, setCertificate] = useState({
    name: "",
    unique_id: "",
    serial: "",
    date: "",
    owner: "",
    metadata: "",
  });
  const [signature, setSignature] = useState({
    v: "",
    r: "",
    s: "",
  });
  const [queryAddress1, setQueryAddress1] = useState("");
  const [queryAddress2, setQueryAddress2] = useState("");
  const [queryName, setQueryName] = useState("");
  const [manufacturerDetails, setManufacturerDetails] = useState("");
  const [manufacturerAddress1, setManufacturerAddress1] = useState("");
  const [manufacturerAddress2, setManufacturerAddress2] = useState("");
  const [signatureResult, setSignatureResult] = useState("");
  const [formVisible, setFormVisible] = useState("");

  const { VITE_SEPOLIA_URL, VITE_ACCOUNT_ADDRESS } = import.meta.env;

  const PROVIDER = new RpcProvider({
    nodeUrl: VITE_SEPOLIA_URL,
  });

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
      const { wallet } = await connect({
        provider: PROVIDER,
      });

      if (wallet && wallet.isConnected) {
        setProvider(wallet.provider);
        setAccount(wallet.account);
        setAddress(wallet.selectedAddress);
        toast.success(`Connected: ${wallet.selectedAddress.slice(0, 10)}...`);
      } else {
        toast.error("Failed to connect wallet");
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    }
  };

  const checkConnection = () => {
    if (!address) {
      toast.error("Connect wallet!");
      return false;
    }
    return true;
  };

  const viewContract = () => {
    return new Contract(ABI, VITE_ACCOUNT_ADDRESS, provider);
  };

  const stateChangeContract = () => {
    return new Contract(ABI, VITE_ACCOUNT_ADDRESS, account);
  };

  const convertFelt252ToString = (felt252) => {
    try {
      const bn = BigNumber(felt252);
      const hex_it = "0x" + bn.toString(16);
      return shortString.decodeShortString(hex_it);
    } catch (error) {
      toast.error(`Error decoding felt252: ${error.message}`);
      return "";
    }
  };

  const hex_it = (value) => {
    return "0x" + BigNumber(value).toString(16);
  };

  const registerManufacturer = async () => {
    if (!checkConnection()) return;
    if (!account) return toast.error("Account not initialized");

    try {
      const contract = stateChangeContract();
      const feltName = shortString.encodeShortString(manufacturerName);

      const res = await contract.manufacturer_registers(feltName);
      const txHash = res?.transaction_hash;
      const txResult = await provider.waitForTransaction(txHash);
      const events = contract.parseEvents(txResult);

      console.log(events);

      const manufacturerAddress =
        events[0]["eri::events::EriEvents::ManufacturerRegistered"]
          .manufacturer_address;
      const manuName =
        events[0]["eri::events::EriEvents::ManufacturerRegistered"]
          .manufacturer_name;
      console.log("After out-Name:", hex_it(manufacturerAddress));

      toast.success(
        `Manufacturer ${manuName} with 
                Address ${manufacturerAddress} registered successfully`
      );
      setManufacturerName("");
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    }
  };

  const getManufacturer = async () => {
    if (!checkConnection()) return;

    try {
      const contract = viewContract();
      const result = await contract.get_manufacturer(queryAddress1);
      console.log(result);
      const decodedName = convertFelt252ToString(result.manufacturer_name);

      setManufacturerDetails(
        `Address: ${hex_it(result.manufacturer_address)}, 
        Name: ${decodedName}, 
        Registered: ${result.is_registered}, 
        Timestamp: ${result.registered_at}`
      );
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    }
  };

  const getManufacturerAddressByName = async () => {
    if (!checkConnection()) return;

    try {
      const contract = viewContract();
      const feltName = shortString.encodeShortString(queryName);
      const result = await contract.get_manufacturer_address_by_name(feltName);
      setManufacturerAddress1(hex_it(result));
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    }
  };

  const getManufacturerAddress = async () => {
    if (!checkConnection()) return;

    try {
      const contract = viewContract();
      const result = await contract.get_manufacturer_address(queryAddress2);
      setManufacturerAddress2(hex_it(result));
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    }
  };

  const verifySignature = async () => {
    if (!checkConnection()) return;
    if (!account) return toast.error("Account not initialized");

    try {
      const contract = viewContract();

      // to create typed data for signing
      const typedData = getTypedData(certificate, account.address);

      console.log("Typed Data:", JSON.stringify(typedData, null, 2));

      // sign the typed data
      const signature = await account.signMessage(typedData);
      console.log("Signature:", signature);

      if (!signature || !Array.isArray(signature) || signature.length < 3) {
        return new Error("Invalid signature format returned by wallet");
      }

      const { is_registered, manufacturer_address } =
        await contract.get_manufacturer(account.address);
      const manufacturerAddress = hex_it(BigInt(manufacturer_address));

      if (manufacturerAddress !== account.address || !is_registered) {
        throw new Error("Unauthorized Wallet");
      }

      const msgHash = await account.hashMessage(typedData);

      console.log("Message Hash:", msgHash);

      const isValid4 = await provider.verifyMessageInStarknet(
        msgHash, // or typedData
        signature,
        account.address
      );

      console.log("Is Valid: ", isValid4);

      setSignatureResult(`Signature valid: ${isValid4}`);
      toast.success(`Signature verification: ${isValid4}`);
    } catch (error) {
      console.error("Signature error:", error);
      toast.error(`Error: ${error.message}`);
    }
  };

  const claimOwnership = async () => {
    if (!checkConnection()) return;
    if (!account) return toast.error("Account not initialized");

    try {
      const contract = stateChangeContract();

      const { is_registered, manufacturer_address } =
        await contract.get_manufacturer(account.address);
      const manufacturerAddress = hex_it(BigInt(manufacturer_address));

      if (manufacturerAddress !== account.address || !is_registered) {
        throw new Error("Unauthorized Wallet");
      }

      const msgHash = await account.hashMessage(
        getTypedData(certificate, certificate.owner)
      );

      console.log("Message Hash:", msgHash);

      const sign = [signature.v, signature.r, signature.s];

      const isValid4 = await provider.verifyMessageInStarknet(
        msgHash, // or typedData
        sign,
        certificate.owner
      );

      console.log("Is Valid: ", isValid4);

      if (!isValid4) {
        throw new Error("Invalid Product");
      }

      const cert = {
        name: shortString.encodeShortString(certificate.name),
        unique_id: shortString.encodeShortString(certificate.unique_id),
        serial: shortString.encodeShortString(certificate.serial),
        date: BigInt(certificate.date), // Use Number to avoid BigInt issues
        owner: account.address,
        metadata: certificate.metadata
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
          .map((item) => shortString.encodeShortString(item)),
      };

      const res = await contract.user_claim_ownership(cert);

      const txHash = res?.transaction_hash;
      await provider.waitForTransaction(txHash);

      toast.success(`${certificate.unique_id} claimed successfully`);
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <button onClick={connectWallet} className="connect-btn">
          {address ? `${address.substring(0, 10)}...` : "Connect Wallet"}
        </button>
      </header>

      <h1 className="title">Starknet Authenticity</h1>
      <div className="main-content">
        {/* Card 1: View Functions */}
        <div className="card card-1">
          <div className="group-1">
            <div>
              <button onClick={() => setFormVisible("getManufacturer")}>
                Get Manufacturer
              </button>
              {formVisible === "getManufacturer" && (
                <form
                  className="function-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    getManufacturer();
                  }}
                >
                  <input
                    type="text"
                    placeholder="Manufacturer Address"
                    value={queryAddress1}
                    onChange={(e) => setQueryAddress1(e.target.value)}
                  />
                  <button type="submit">Submit</button>
                  <h2 className="outputs">{manufacturerDetails || " "}</h2>
                </form>
              )}
            </div>

            <div className="separator"></div>
            <div>
              <button
                onClick={() => setFormVisible("getManufacturerAddressByName")}
              >
                Get Address by Name
              </button>
              {formVisible === "getManufacturerAddressByName" && (
                <form
                  className="function-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    getManufacturerAddressByName();
                  }}
                >
                  <input
                    type="text"
                    placeholder="Manufacturer Name"
                    value={queryName}
                    onChange={(e) => setQueryName(e.target.value)}
                  />
                  <button type="submit">Submit</button>
                  <h2 className="outputs">{manufacturerAddress1 || " "}</h2>
                </form>
              )}
            </div>

            <div className="separator"></div>
            <div>
              <button onClick={() => setFormVisible("getManufacturerAddress")}>
                Get Manufacturer Address
              </button>
              {formVisible === "getManufacturerAddress" && (
                <form
                  className="function-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    getManufacturerAddress();
                  }}
                >
                  <input
                    type="text"
                    placeholder="Manufacturer Address"
                    value={queryAddress2}
                    onChange={(e) => setQueryAddress2(e.target.value)}
                  />
                  <button type="submit">Submit</button>
                  <h2 className="outputs">{manufacturerAddress2 || " "}</h2>
                </form>
              )}
            </div>

            <div className="separator"></div>

            <div>
              <button onClick={() => setFormVisible("verifySignature")}>
                Verify Signature
              </button>
              {formVisible === "verifySignature" && (
                <form
                  className="function-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    verifySignature();
                  }}
                >
                  <input
                    type="text"
                    placeholder="Certificate Name"
                    value={certificate.name}
                    onChange={(e) =>
                      setCertificate({ ...certificate, name: e.target.value })
                    }
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
                  />
                  <input
                    type="text"
                    placeholder="Serial"
                    value={certificate.serial}
                    onChange={(e) =>
                      setCertificate({ ...certificate, serial: e.target.value })
                    }
                  />
                  <input
                    type="number"
                    placeholder="Date (Unix timestamp)"
                    value={certificate.date}
                    onChange={(e) =>
                      setCertificate({ ...certificate, date: e.target.value })
                    }
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
                  />
                  <button type="submit">Submit</button>
                  <h2 className="outputs">{signatureResult || " "}</h2>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: State-Changing Functions */}
        <div className="card card-2">
          <div className="group-2">
            <div>
              <button onClick={() => setFormVisible("registerManufacturer")}>
                Register Manufacturer
              </button>
              {formVisible === "registerManufacturer" && (
                <form
                  className="function-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    registerManufacturer();
                  }}
                >
                  <input
                    type="text"
                    placeholder="Manufacturer Name"
                    value={manufacturerName}
                    onChange={(e) => setManufacturerName(e.target.value)}
                  />
                  <button type="submit">Submit</button>
                </form>
              )}
            </div>

            <div className="separator"></div>
            <div>
              <button onClick={() => setFormVisible("claimOwnership")}>
                Claim Ownership
              </button>
              {formVisible === "claimOwnership" && (
                <form
                  className="function-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    claimOwnership();
                  }}
                >
                  <input
                    type="text"
                    placeholder="Certificate Name"
                    value={certificate.name}
                    onChange={(e) =>
                      setCertificate({ ...certificate, name: e.target.value })
                    }
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
                  />
                  <input
                    type="text"
                    placeholder="Serial"
                    value={certificate.serial}
                    onChange={(e) =>
                      setCertificate({ ...certificate, serial: e.target.value })
                    }
                  />
                  <input
                    type="number"
                    placeholder="Date (Unix timestamp)"
                    value={certificate.date}
                    onChange={(e) =>
                      setCertificate({ ...certificate, date: e.target.value })
                    }
                  />
                  <input
                    type="text"
                    placeholder="Owner Address"
                    value={certificate.owner}
                    onChange={(e) =>
                      setCertificate({ ...certificate, owner: e.target.value })
                    }
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
                  />
                  <input
                    type="number"
                    placeholder="v"
                    value={signature.v}
                    onChange={(e) =>
                      setSignature({
                        ...signature,
                        v: e.target.value,
                      })
                    }
                  />
                  <input
                    type="number"
                    placeholder="r"
                    value={signature.r}
                    onChange={(e) =>
                      setSignature({
                        ...signature,
                        r: e.target.value,
                      })
                    }
                  />
                  <input
                    type="number"
                    placeholder="s"
                    value={signature.s}
                    onChange={(e) =>
                      setSignature({
                        ...signature,
                        s: e.target.value,
                      })
                    }
                  />
                  <button type="submit">Submit</button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}

export default App;
