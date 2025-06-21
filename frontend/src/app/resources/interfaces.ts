// Type definitions for imported utilities
interface Certificate {
    name: string;
    id: string;
    serial: string;
    date: string;
    owner: string;
    metadata: string[];
}

export type {Certificate};