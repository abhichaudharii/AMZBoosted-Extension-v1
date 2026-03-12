// Error type constants for tool execution
// Used by the extension to classify failures and report them to /tasks/[taskId]/finalize.
// The server uses SYSTEM_ERRORS to determine which failures are eligible for credit refunds.

/** System errors — caused by Amazon infrastructure or network issues. Eligible for refund. */
export const SYSTEM_ERRORS = [
    'amazon_blocked',    // Amazon actively blocked the request (robot check, etc.)
    'network_timeout',   // HTTP timeout or connection failure
    'rate_limited',      // Amazon or server returned 429 Too Many Requests
    'server_error',      // 5xx response from server
    'session_expired',   // Seller Central session timed out
    'captcha_required',  // CAPTCHA challenge detected
] as const;

/** User errors — caused by invalid input or access issues. Not eligible for refund. */
export const USER_ERRORS = [
    'invalid_asin',              // ASIN format is wrong or ASIN does not exist
    'product_not_found',         // Product page not found (404)
    'access_denied',             // User lacks access to this Seller Central section
    'invalid_url',               // Input URL is malformed
    'marketplace_not_supported', // Tool doesn't support this marketplace
] as const;

export type SystemErrorType = (typeof SYSTEM_ERRORS)[number];
export type UserErrorType = (typeof USER_ERRORS)[number];
export type ErrorType = SystemErrorType | UserErrorType | 'unknown_error';

/** Set for O(1) membership checks */
export const SYSTEM_ERROR_SET = new Set<string>(SYSTEM_ERRORS);
export const USER_ERROR_SET = new Set<string>(USER_ERRORS);

export function isSystemError(errorType: string): boolean {
    return SYSTEM_ERROR_SET.has(errorType);
}

export function isUserError(errorType: string): boolean {
    return USER_ERROR_SET.has(errorType);
}
