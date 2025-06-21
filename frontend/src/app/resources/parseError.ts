/**
 * Enhanced error parser for Ethereum/smart contract errors
 * @param {Error | ethers.ContractError} error - The error object to parse
 * @returns {string} Human-readable error message
 */

export const parseError = (error: unknown): string => {
    // Extract message with fallbacks
    const message = (
        (error as { data?: { message?: string } })?.data?.message ||
        (error as { error?: { message?: string } })?.error?.message ||
        (error as { reason?: string })?.reason ||
        (error as { message?: string })?.message ||
        "Unknown error"
    )
        .toString()
        .toLowerCase();

    // Error message mapping (more maintainable than if/else chain)
    const errorMap: Record<string, string> = {
        // Contract-specific errors
        does_not_exist: "does not exist",
        zero_address: "Invalid address: Zero address not allowed",

        already_registered: "Manufacturer already registered",
        invalid_manufacturer_name: "Manufacturer name must be at least 2 characters",
        name_not_available: "Manufacturer name is already taken",

        invalid_signature: "Invalid signature - authentication failed",
        not_registered: "User is not registered",
        username_must_be_at_least_3_letters: "Username must be at least 3 characters",
        user_does_not_exist: "User not found",
        item_claimed_already: "Item already claimed",
        item_doesnt_exist: "Item doesn't exist",
        cannot_generate_code_for_yourself: "Cannot generate code for yourself",
        item_not_claimed_yet: "Item not claimed yet",
        unauthorized: "Unauthorized operation",
        only_owner: "Only owner can perform this action",

        // Common Ethereum errors
        "user rejected transaction": "Transaction was canceled by user",
        insufficient_funds: "Insufficient funds for transaction",
        "nonce too low": "Network error - please try again",
        "gas limit exceeded": "Transaction requires more gas than allowed",
        "execution reverted": "Transaction reverted by smart contract",
    };

    // Check for matching error keys
    for (const [key, value] of Object.entries(errorMap)) {
        if (message.includes(key)) {
            return value;
        }
    }

    // Handle JSON-RPC error codes
    if ((error as { code?: number }).code) {
        switch ((error as { code: number }).code) {
            case 4001:
                return "Transaction rejected by user";
            case -32603:
                return "Internal JSON-RPC error";
            case -32000:
                return "Invalid input parameters";
            default:
                break;
        }
    }

    // Fallback: Return original message with cleanup
    return (
        message
            .replace("execution reverted:", "")
            .replace("error:", "")
            .trim() || "An unknown error occurred"
    );
};