"use strict";
/**
 * Unified Payment SDK - Type Definitions
 * Generated from unified payment model specifications
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionError = exports.RecurringType = exports.ErrorCode = exports.ErrorCategory = exports.TransactionStatus = exports.SourceType = void 0;
// ============================================================================
// Enums
// ============================================================================
var SourceType;
(function (SourceType) {
    SourceType["RAW_PAN"] = "raw_pan";
    SourceType["BASIS_THEORY_TOKEN"] = "basis_theory_token";
    SourceType["BASIS_THEORY_TOKEN_INTENT"] = "basis_theory_token_intent";
    SourceType["NETWORK_TOKEN"] = "network_token";
    SourceType["PROCESSOR_TOKEN"] = "processor_token";
})(SourceType || (exports.SourceType = SourceType = {}));
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["AUTHORIZED"] = "authorized";
    TransactionStatus["DECLINED"] = "declined";
    TransactionStatus["ERROR"] = "error";
    TransactionStatus["CANCELLED"] = "cancelled";
    TransactionStatus["PENDING"] = "pending";
    TransactionStatus["ACTION_REQUIRED"] = "action_required";
    TransactionStatus["PARTIALLY_AUTHORIZED"] = "partially_authorized";
    TransactionStatus["CAPTURED"] = "captured";
    TransactionStatus["REFUNDED"] = "refunded";
    TransactionStatus["VOIDED"] = "voided";
    TransactionStatus["RECEIVED"] = "received";
})(TransactionStatus || (exports.TransactionStatus = TransactionStatus = {}));
var ErrorCategory;
(function (ErrorCategory) {
    ErrorCategory["AUTHENTICATION_ERROR"] = "authentication_error";
    ErrorCategory["PAYMENT_METHOD_ERROR"] = "payment_method_error";
    ErrorCategory["PROCESSING_ERROR"] = "processing_error";
    ErrorCategory["VALIDATION_ERROR"] = "validation_error";
    ErrorCategory["FRAUD_DECLINE"] = "fraud_decline";
    ErrorCategory["UNKNOWN"] = "unknown";
})(ErrorCategory || (exports.ErrorCategory = ErrorCategory = {}));
var ErrorCode;
(function (ErrorCode) {
    ErrorCode["CARD_DECLINED"] = "card_declined";
    ErrorCode["INSUFFICIENT_FUNDS"] = "insufficient_funds";
    ErrorCode["EXPIRED_CARD"] = "expired_card";
    ErrorCode["INVALID_CARD"] = "invalid_card";
    ErrorCode["CVC_DECLINED"] = "cvc_declined";
    ErrorCode["BLOCKED_CARD"] = "blocked_card";
    ErrorCode["FRAUD_DETECTED"] = "fraud_detected";
    ErrorCode["THREE_DS_FAILED"] = "three_ds_failed";
    ErrorCode["ISSUER_UNAVAILABLE"] = "issuer_unavailable";
    ErrorCode["NOT_SUPPORTED"] = "not_supported";
    ErrorCode["ACQUIRER_ERROR"] = "acquirer_error";
    ErrorCode["PIN_ERROR"] = "pin_error";
    ErrorCode["CANCELLED_BY_SHOPPER"] = "cancelled_by_shopper";
    ErrorCode["AVS_DECLINED"] = "avs_declined";
    ErrorCode["AUTHENTICATION_ERROR"] = "authentication_error";
    ErrorCode["VALIDATION_ERROR"] = "validation_error";
    ErrorCode["RATE_LIMIT"] = "rate_limit";
    ErrorCode["PSP_ERROR"] = "psp_error";
    ErrorCode["UNKNOWN"] = "unknown";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
var RecurringType;
(function (RecurringType) {
    RecurringType["ONE_TIME"] = "one_time";
    RecurringType["CARD_ON_FILE"] = "card_on_file";
    RecurringType["SUBSCRIPTION"] = "subscription";
    RecurringType["UNSCHEDULED"] = "unscheduled";
})(RecurringType || (exports.RecurringType = RecurringType = {}));
// ============================================================================
// Exceptions
// ============================================================================
class TransactionError extends Error {
    constructor(response) {
        const errorMessage = response.providerErrors.length > 0
            ? response.providerErrors.join(', ')
            : 'Transaction failed';
        super(errorMessage);
        this.name = 'TransactionError';
        this.response = response;
    }
}
exports.TransactionError = TransactionError;
