// Type definitions for imported utilities
interface Certificate {
    name: string;
    id: string;
    serial: string;
    date: string;
    owner: string;
    metadata: string[];
}
interface InputCertificate {
    name: string;
    id: string;
    serial: string;
    date: string;
    owner: string;
    metadata: string;
}

interface CertificateResult {
    certificate: Certificate;
    msgHash: string;
    qrData: string;
    verificationResult: boolean;
    error?: string;
}

export type {Certificate, CertificateResult, InputCertificate};