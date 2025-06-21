import BigNumber from "bignumber.js";
import {toast} from "react-toastify";
import {ContractAddress, shortString} from "starknet";

const felt252ToString = (felt252: string): string => {
    try {
        const bn = BigNumber(felt252);
        const hex_it = "0x" + bn.toString(16);
        return shortString.decodeShortString(hex_it);
    } catch (error: any) {
        toast.error(`Error decoding felt252: ${error.message}`);
        return "";
    }
};

const stringToFelt252 = (stringValue: string) => {
    return shortString.encodeShortString(stringValue)
}


const hex_it = (value: string): string => {
    return "0x" + BigNumber(value).toString(16);
}

enum ContractType {
    VIEW = "1",
    STATE_CHANGE = "2",
}


export {
    felt252ToString,
    hex_it,
    ContractType,
    stringToFelt252
};
