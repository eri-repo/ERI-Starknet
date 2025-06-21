// import { useState, useRef } from "react";
// import { hex_it, checkConnection, parseError } from "../resources/utilities";
// import { Contract, RpcProvider, typedData } from "starknet";
// import { toast } from "react-toastify";
// import { QRCodeCanvas } from "qrcode.react";
// import html2canvas from "html2canvas";
// import Papa from "papaparse";
//
// interface Certificate {
//     name: string;
//     unique_id: string;
//     serial: string;
//     date: string;
//     owner: string;
//     metadata: string | string[];
// }
//
// interface CertificateResult {
//     certificate: Certificate;
//     msgHash: string;
//     qrData: string;
//     verificationResult: boolean;
//     error?: string;
// }
//
// enum ContractType {
//     VIEW = "view",
//     STATE = "state",
// }
//
// const getContract = async (
//     address: string,
//     type: ContractType
// ): Promise<Contract> => {
//     return new Contract([], address, new RpcProvider());
// };
//
// const getTypedData = (cert: Certificate): any => {
//     return {};
// };
//
// const App: React.FC = () => {
//     const [certificates, setCertificates] = useState<Certificate[]>([]);
//     const [certificateResults, setCertificateResults] = useState<CertificateResult[]>([]);
//     const [address, setAddress] = useState<string | null>(null);
//     const [account, setAccount] = useState<any>(null);
//     const [provider, setProvider] = useState<RpcProvider | null>(null);
//     const qrCodeRefs = useRef<Map<string, HTMLDivElement>>(new Map()); // Refs for QR codes
//
//     const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
//         const file = event.target.files?.[0];
//         if (!file) return;
//
//         if (!file.name.endsWith(".csv")) {
//             toast.error("Please upload a CSV file");
//             return;
//         }
//
//         Papa.parse(file, {
//             header: true,
//             skipEmptyLines: true,
//             complete: (result) => {
//                 const parsedCertificates: Certificate[] = result.data.map((row: any) => ({
//                     name: row.name || "",
//                     unique_id: row.unique_id || "",
//                     serial: row.serial || "",
//                     date: "",
//                     owner: address || "",
//                     metadata: row.metadata || "",
//                 }));
//                 setCertificates(parsedCertificates);
//                 toast.success(`Loaded ${parsedCertificates.length} certificates`);
//             },
//             error: (error) => {
//                 toast.error(`CSV parsing error: ${error.message}`);
//             },
//         });
//     };
//
//     const signAndVerifySignatureOffChain = async (): Promise<void> => {
//         if (!checkConnection(address)) return;
//         if (certificates.length === 0) {
//             toast.error("No certificates to process");
//             return;
//         }
//
//         const contract = await getContract(
//             process.env.NEXT_PUBLIC_AUTHENTICITY_ADDRESS!,
//             ContractType.VIEW
//         );
//
//         const results: CertificateResult[] = [];
//
//         for (const certInput of certificates) {
//             try {
//                 const cert: Certificate = {
//                     ...certInput,
//                     date: Math.floor(Date.now() / 1000).toString(),
//                     owner: address!,
//                     metadata: certInput.metadata
//                         .split(",")
//                         .map((item: string) => item.trim())
//                         .filter(Boolean),
//                 };
//
//                 console.log("Certificate Struct:", cert);
//
//                 const certTypedData = getTypedData(cert);
//                 const msgHash = typedData.getMessageHash(certTypedData, address!);
//                 console.log("Message Hash:", msgHash);
//
//                 const result: boolean = await contract.verify_signature(cert, msgHash);
//
//                 if (!result) {
//                     throw new Error("Signature verification failed!");
//                 }
//
//                 const qrData = JSON.stringify({
//                     certificate: {
//                         name: cert.name,
//                         unique_id: cert.unique_id,
//                         serial: cert.serial,
//                         date: cert.date,
//                         owner: cert.owner,
//                         metadata: cert.metadata,
//                     },
//                     msgHash,
//                 });
//                 console.log("QR Code Struct:", qrData);
//
//                 results.push({
//                     certificate: cert,
//                     msgHash,
//                     qrData,
//                     verificationResult: result,
//                 });
//
//                 console.log("On-chain verification:", result);
//             } catch (error: unknown) {
//                 const message = parseError(error);
//                 results.push({
//                     certificate: certInput,
//                     msgHash: "",
//                     qrData: "",
//                     verificationResult: false,
//                     error: message,
//                 });
//                 console.error(`Error processing certificate ${certInput.unique_id}:`, message);
//             }
//         }
//
//         setCertificateResults(results);
//         toast.success(`Processed ${results.length} certificates`);
//     };
//
//
//
//     return (
//         <div className="bg-white p-6 rounded-lg shadow-lg">
//             {
//     {
//         id: "verifySignature",
//             label: "Verify Signature",
//         form: (
//         <form
//             onSubmit={(e: React.FormEvent) => {
//         e.preventDefault();
//         signAndVerifySignatureOffChain();
//     }}
//         className="space-y-4"
//         >
//         <div>
//             <label
//                 htmlFor="csv-upload"
//         className="block text-sm font-medium text-gray-700"
//             >
//             Upload Certificates (CSV)
//     </label>
//     <input
//         id="csv-upload"
//         type="file"
//         accept=".csv"
//         onChange={handleFileUpload}
//         className="mt-1 w-full p-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
//             />
//             </div>
//             <button
//         type="submit"
//         className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
//             >
//             Process Certificates
//     </button>
//         {certificateResults.length > 0 && (
//             <div className="mt-4 max-h-96 overflow-y-auto">
//             <h3 className="text-lg font-semibold text-blue-800">
//                 Certificate Results
//         </h3>
//         <ul className="space-y-4">
//             {certificateResults.map((result, index) => (
//                     <li
//                         key={result.certificate.unique_id || index}
//                 className="bg-gray-50 p-4 rounded-lg"
//                 >
//                 <div className="grid grid-cols-1 gap-2">
//                 <p className="font-semibold">
//                     Certificate {index + 1}:{" "}
//             {result.certificate.name}
//             </p>
//             <p>Unique ID: {result.certificate.unique_id}</p>
//         <p>Serial: {result.certificate.serial}</p>
//         <p>Metadata: {result.certificate.metadata}</p>
//         <p>
//         Verification:{" "}
//             <span
//                 className={
//                     result.verificationResult
//                         ? "text-green-600"
//                         : "text-red-600"
//                 }
//                 >
//                 {result.verificationResult
//                         ? "Success"
//                         : result.error || "Failed"}
//                 </span>
//                 </p>
//             {result.qrData && (
//                 <div className="flex flex-col items-center">
//                 <div
//                     ref={(el) =>
//                 el &&
//                 qrCodeRefs.current.set(
//                     result.certificate.unique_id,
//                     el
//                 )
//             }
//                 className="relative inline-block"
//                 >
//                 <QRCodeCanvas
//                     value={result.qrData}
//                 size={128}
//                 fgColor="#1e3a8a"
//                 bgColor="#e0f2fe"
//                 level="M"
//                 className="rounded-lg border border-gray-200 p-2"
//                 imageSettings={{
//                 src: "/logo.png",
//                     x: undefined,
//                     y: undefined,
//                     height: 32,
//                     width: 32,
//                     excavate: true,
//             }}
//                 />
//                 </div>
//                 <button
//                 onClick={() =>
//                 downloadQRCode(
//                     result.certificate.unique_id
//                 )
//             }
//                 className="mt-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-3 rounded-lg transition duration-300"
//                     >
//                     Download QR Code
//             </button>
//             </div>
//             )}
//             </div>
//             </li>
//         ))}
//             </ul>
//             </div>
//         )}
//         </form>
//     ),
//     }
// }
//     </div>
// );
// };
//
// //==================
//
//
// import { useState, useRef } from "react";
// import { hex_it, checkConnection, parseError } from "../resources/utilities";
// import { Contract, RpcProvider, typedData } from "starknet";
// import { toast } from "react-toastify";
// import { QRCodeCanvas } from "qrcode.react";
// import html2canvas from "html2canvas";
// import Papa from "papaparse";
//
// interface Certificate {
//     name: string;
//     id: string;
//     serial: string;
//     date: string;
//     owner: string;
//     metadata: string | string[];
// }
//
// interface CertificateResult {
//     certificate: Certificate;
//     msgHash: string;
//     qrData: string;
//     verificationResult: boolean;
//     error?: string;
// }
//
// enum ContractType {
//     VIEW = "view",
//     STATE = "state",
// }
//
//
//
// const App: React.FC = () => {
//     const [certificates, setCertificates] = useState<Certificate[]>([]);
//     const [certificateResults, setCertificateResults] = useState<CertificateResult[]>([]);
//     const [address, setAddress] = useState<string | null>(null);
//     const [account, setAccount] = useState<any>(null);
//     const [provider, setProvider] = useState<RpcProvider | null>(null);
//     const qrCodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
//
//     const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
//         const file = event.target.files?.[0];
//         if (!file) {
//             toast.error("No file selected");
//             return;
//         }
//
//         if (!file.name.endsWith(".csv")) {
//             toast.error("Please upload a CSV file");
//             return;
//         }
//
//         if (!address) {
//             toast.error("Connect wallet before uploading CSV");
//             return;
//         }
//
//         Papa.parse(file, {
//             header: true,
//             skipEmptyLines: true,
//             complete: (result) => {
//                 console.log("Raw CSV Data:", result.data);
//
//                 const parsedCertificates: Certificate[] = result.data
//                     .map((row: unknown, index: number) => {
//                         if (typeof row !== "object" || row === null) {
//                             console.warn(`Skipping invalid row ${index + 1}: Not an object`, row);
//                             toast.warn(`Skipped row ${index + 1}: Invalid row format`);
//                             return null;
//                         }
//
//                         const { name, unique_id, serial, metadata } = row as {
//                             name?: unknown;
//                             unique_id?: unknown;
//                             serial?: unknown;
//                             metadata?: unknown;
//                         };
//
//                         if (
//                             typeof name !== "string" ||
//                             !name.trim() ||
//                             typeof unique_id !== "string" ||
//                             !unique_id.trim() ||
//                             typeof serial !== "string" ||
//                             !serial.trim() ||
//                             metadata === undefined
//                         ) {
//                             console.warn(`Skipping invalid row ${index + 1}:`, {
//                                 name,
//                                 unique_id,
//                                 serial,
//                                 metadata,
//                             });
//                             toast.warn(
//                                 `Skipped row ${index + 1}: Missing or invalid name, unique_id, serial, or metadata`
//                             );
//                             return null;
//                         }
//
//                         const cert: Certificate = {
//                             name: name.trim(),
//                             id: unique_id.trim(),
//                             serial: serial.trim(),
//                             date: Math.floor(Date.now() / 1000).toString(),
//                             owner: address,
//                             metadata: metadata.trim(),
//                         };
//
//                         console.log(`Valid certificate at row ${index + 1}:`, cert);
//                         return cert;
//                     })
//                     .filter((cert): cert is Certificate => cert !== null);
//
//                 console.log("Parsed Certificates:", parsedCertificates);
//
//                 setCertificates(parsedCertificates);
//                 const skippedCount = result.data.length - parsedCertificates.length;
//                 toast.success(
//                     `Loaded ${parsedCertificates.length} valid certificates${
//                         skippedCount > 0 ? ` (${skippedCount} rows skipped)` : ""
//                     }`
//                 );
//             },
//             error: (error) => {
//                 console.error("CSV Parsing Error:", error);
//                 toast.error(`CSV parsing error: ${error.message}`);
//             },
//         });
//     };
//
//     const signAndVerifySignatureOffChain = async (): Promise<void> => {
//         if (!checkConnection(address)) return;
//         if (certificates.length === 0) {
//             toast.error("No certificates to process");
//             return;
//         }
//
//         const contract = await getContract(
//             process.env.NEXT_PUBLIC_AUTHENTICITY_ADDRESS!,
//             ContractType.VIEW
//         );
//
//         const results: CertificateResult[] = [];
//
//         for (const certInput of certificates) {
//             try {
//                 const cert: Certificate = {
//                     ...certInput,
//                     date: Math.floor(Date.now() / 1000).toString(),
//                     owner: address!,
//                     metadata: certInput.metadata
//                         .split(",")
//                         .map((item: string) => item.trim())
//                         .filter(Boolean),
//                 };
//
//                 console.log("Certificate Struct:", cert);
//
//                 const certTypedData = getTypedData(cert);
//                 const msgHash = typedData.getMessageHash(certTypedData, address!);
//                 console.log("Message Hash:", msgHash);
//
//                 const result: boolean = await contract.verify_signature(cert, msgHash);
//
//                 if (!result) {
//                     throw new Error("Signature verification failed!");
//                 }
//
//                 const qrData = JSON.stringify({
//                     certificate: {
//                         name: cert.name,
//                         id: cert.id,
//                         serial: cert.serial,
//                         date: cert.date,
//                         owner: cert.owner,
//                         metadata: cert.metadata,
//                     },
//                     msgHash,
//                 });
//                 console.log("QR Code Struct:", qrData);
//
//                 results.push({
//                     certificate: cert,
//                     msgHash,
//                     qrData,
//                     verificationResult: result,
//                 });
//             } catch (error: unknown) {
//                 const message = parseError(error);
//                 results.push({
//                     certificate: certInput,
//                     msgHash: "",
//                     qrData: "",
//                     verificationResult: false,
//                     error: message,
//                 });
//                 console.error(`Error processing certificate ${certInput.id}:`, message);
//             }
//         }
//
//         setCertificateResults(results);
//         toast.success(`Processed ${results.length} certificates`);
//     };
//
//
//
//     return (
//         <div className="bg-white p-6 rounded-lg shadow-lg">
//             {
//                 {
//                     id: "verifyMultipleSignatures",
//                     label: "Verify Signature",
//                     form: (
//                         <form
//                             onSubmit={(e: React.FormEvent) => {
//                                 e.preventDefault();
//                                 signAndVerifyMultipleSignaturesOffChain();
//                             }}
//                             className="space-y-4"
//                         >
//                             <div>
//                                 <label
//                                     htmlFor="csv-upload"
//                                     className="block text-sm font-medium text-gray-700"
//                                 >
//                                     Upload Certificates (CSV)
//                                 </label>
//                                 <input
//                                     id="csv-upload"
//                                     type="file"
//                                     accept=".csv"
//                                     onChange={handleFileUpload}
//                                     className="mt-1 w-full p-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
//                                 />
//                             </div>
//                             <button
//                                 type="submit"
//                                 className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
//                             >
//                                 Process Certificates
//                             </button>
//                             {certificateResults.length > 0 && (
//                                 <div className="mt-4 max-h-96 overflow-y-auto">
//                                     <h3 className="text-lg font-semibold text-blue-800">
//                                         Certificate Results
//                                     </h3>
//                                     <ul className="space-y-4">
//                                         {certificateResults.map((result, index) => (
//                                             <li
//                                                 key={result.certificate.id || index}
//                                                 className="bg-gray-50 p-4 rounded-lg"
//                                             >
//                                                 <div className="grid grid-cols-1 gap-2">
//                                                     <p className="font-semibold">
//                                                         Certificate {index + 1}:{" "}
//                                                         {result.certificate.name}
//                                                     </p>
//                                                     <p>Unique ID: {result.certificate.id}</p>
//                                                     <p>Serial: {result.certificate.serial}</p>
//                                                     <p>Metadata: {result.certificate.metadata}</p>
//                                                     <p>
//                                                         Verification:{" "}
//                                                         <span
//                                                             className={
//                                                                 result.verificationResult
//                                                                     ? "text-green-600"
//                                                                     : "text-red-600"
//                                                             }
//                                                         >
//                                                             {result.verificationResult
//                                                                 ? "Success"
//                                                                 : result.error || "Failed"}
//                                                         </span>
//                                                     </p>
//                                                     {result.qrData && (
//                                                         <div className="flex flex-col items-center">
//                                                             <div
//                                                                 ref={(el) =>
//                                                                     el &&
//                                                                     qrCodeRefs.current.set(
//                                                                         result.certificate.id,
//                                                                         el
//                                                                     )
//                                                                 }
//                                                                 className="relative inline-block"
//                                                             >
//                                                                 <QRCodeCanvas
//                                                                     value={result.qrData}
//                                                                     size={128}
//                                                                     fgColor="#1e3a8a"
//                                                                     bgColor="#e0f2fe"
//                                                                     level="M"
//                                                                     className="rounded-lg border border-gray-200 p-2"
//                                                                     imageSettings={{
//                                                                         src: "/logo.png",
//                                                                         x: undefined,
//                                                                         y: undefined,
//                                                                         height: 32,
//                                                                         width: 32,
//                                                                         excavate: true,
//                                                                     }}
//                                                                 />
//                                                             </div>
//                                                             <button
//                                                                 onClick={() =>
//                                                                     downloadQRCode(result.certificate.id)
//                                                                 }
//                                                                 className="mt-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-3 rounded-lg transition duration-300"
//                                                             >
//                                                                 Download QR Code
//                                                             </button>
//                                                         </div>
//                                                     )}
//                                                 </div>
//                                             </li>
//                                         ))}
//                                     </ul>
//                                 </div>
//                             )}
//                         </form>
//                     ),
//                 }
//             }
//         </div>
//     );
// };