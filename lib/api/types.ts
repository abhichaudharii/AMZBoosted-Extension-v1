export enum APIErrorType {
    NETWORK = 'NETWORK_ERROR',
    TIMEOUT = 'TIMEOUT_ERROR',
    AUTH = 'AUTH_ERROR',
    RATE_LIMIT = 'RATE_LIMIT_ERROR',
    CREDITS = 'INSUFFICIENT_CREDITS',
    VALIDATION = 'VALIDATION_ERROR',
    SERVER = 'SERVER_ERROR',
    UNKNOWN = 'UNKNOWN_ERROR',
}

export interface APIError {
    type: APIErrorType;
    message: string;
    statusCode?: number;
    retryAfter?: number;
}

export interface APIResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    errorType?: APIErrorType;
}

export interface IAPIClient {
    request<T>(
        endpoint: string,
        options?: RequestInit,
        attemptNumber?: number
    ): Promise<APIResponse<T>>;

    setAccessToken(token: string): Promise<void>;
    clearAccessToken(): Promise<void>;
}
