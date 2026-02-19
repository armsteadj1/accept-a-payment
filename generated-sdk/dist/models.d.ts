/**
 * Unified Payment SDK - Type Definitions
 * Generated from unified payment model specifications
 */
export declare enum SourceType {
    RAW_PAN = "raw_pan",
    BASIS_THEORY_TOKEN = "basis_theory_token",
    BASIS_THEORY_TOKEN_INTENT = "basis_theory_token_intent",
    NETWORK_TOKEN = "network_token",
    PROCESSOR_TOKEN = "processor_token"
}
export declare enum TransactionStatus {
    AUTHORIZED = "authorized",
    DECLINED = "declined",
    ERROR = "error",
    CANCELLED = "cancelled",
    PENDING = "pending",
    ACTION_REQUIRED = "action_required",
    PARTIALLY_AUTHORIZED = "partially_authorized",
    CAPTURED = "captured",
    REFUNDED = "refunded",
    VOIDED = "voided",
    RECEIVED = "received"
}
export declare enum ErrorCategory {
    AUTHENTICATION_ERROR = "authentication_error",
    PAYMENT_METHOD_ERROR = "payment_method_error",
    PROCESSING_ERROR = "processing_error",
    VALIDATION_ERROR = "validation_error",
    FRAUD_DECLINE = "fraud_decline",
    UNKNOWN = "unknown"
}
export declare enum ErrorCode {
    CARD_DECLINED = "card_declined",
    INSUFFICIENT_FUNDS = "insufficient_funds",
    EXPIRED_CARD = "expired_card",
    INVALID_CARD = "invalid_card",
    CVC_DECLINED = "cvc_declined",
    BLOCKED_CARD = "blocked_card",
    FRAUD_DETECTED = "fraud_detected",
    THREE_DS_FAILED = "three_ds_failed",
    ISSUER_UNAVAILABLE = "issuer_unavailable",
    NOT_SUPPORTED = "not_supported",
    ACQUIRER_ERROR = "acquirer_error",
    PIN_ERROR = "pin_error",
    CANCELLED_BY_SHOPPER = "cancelled_by_shopper",
    AVS_DECLINED = "avs_declined",
    AUTHENTICATION_ERROR = "authentication_error",
    VALIDATION_ERROR = "validation_error",
    RATE_LIMIT = "rate_limit",
    PSP_ERROR = "psp_error",
    UNKNOWN = "unknown"
}
export declare enum RecurringType {
    ONE_TIME = "one_time",
    CARD_ON_FILE = "card_on_file",
    SUBSCRIPTION = "subscription",
    UNSCHEDULED = "unscheduled"
}
export interface Amount {
    value: number;
    currency: string;
}
export interface Source {
    type: SourceType;
    id: string;
    storeWithProvider?: boolean;
    holderName?: string;
    number?: string;
    expiryMonth?: string;
    expiryYear?: string;
    cvc?: string;
    cryptogram?: string;
    eci?: string;
}
export interface Address {
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
}
export interface Customer {
    reference?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    address?: Address;
}
export interface StatementDescription {
    name?: string;
    city?: string;
}
export interface ThreeDS {
    eci?: string;
    authenticationValue?: string;
    version?: string;
    dsTransactionId?: string;
    directoryStatusCode?: string;
    authenticationStatusCode?: string;
    challengeCancelReasonCode?: string;
    challengePreferenceCode?: string;
}
export interface TransactionRequest {
    amount: Amount;
    source: Source;
    reference?: string;
    merchantInitiated?: boolean;
    type?: RecurringType;
    customer?: Customer;
    statementDescription?: StatementDescription;
    threeDs?: ThreeDS;
    previousNetworkTransactionId?: string;
    metadata?: Record<string, string>;
}
export interface RefundRequest {
    originalTransactionId: string;
    reference: string;
    amount: Amount;
    reason?: string;
}
export interface TransactionStatusResponse {
    code: TransactionStatus;
    providerCode: string;
}
export interface ResponseCode {
    category: ErrorCategory;
    code: ErrorCode;
}
export interface ProvisionedSource {
    id: string;
}
export interface TransactionSource {
    type: SourceType;
    id: string;
    provisioned?: ProvisionedSource;
}
export interface TransactionResponse {
    id: string;
    reference?: string;
    amount: Amount;
    status: TransactionStatusResponse;
    responseCode?: ResponseCode;
    source?: TransactionSource;
    networkTransactionId?: string;
    fullProviderResponse: any;
    createdAt: string;
}
export interface RefundResponse {
    id: string;
    reference: string;
    amount: Amount;
    status: TransactionStatusResponse;
    refundedTransactionId?: string;
    fullProviderResponse: any;
    createdAt: string;
}
export interface ErrorResponse {
    errorCodes: ResponseCode[];
    providerErrors: string[];
    fullProviderResponse: any;
}
export declare class TransactionError extends Error {
    readonly response: ErrorResponse;
    constructor(response: ErrorResponse);
}
export interface BinInformation {
    brand?: string;
    type?: string;
    category?: string;
    countryCode?: string;
    issuer?: string;
}
export interface TokenInformation {
    id: string;
    binInformation?: BinInformation;
    data?: {
        number?: string;
        expirationMonth?: string;
        expirationYear?: string;
        cvc?: string;
    };
}
