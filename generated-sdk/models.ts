/**
 * Unified Payment SDK - Type Definitions
 * Generated from unified payment model specifications
 */

// ============================================================================
// Enums
// ============================================================================

export enum SourceType {
  RAW_PAN = 'raw_pan',
  BASIS_THEORY_TOKEN = 'basis_theory_token',
  BASIS_THEORY_TOKEN_INTENT = 'basis_theory_token_intent',
  NETWORK_TOKEN = 'network_token',
  PROCESSOR_TOKEN = 'processor_token'
}

export enum TransactionStatus {
  AUTHORIZED = 'authorized',
  DECLINED = 'declined',
  ERROR = 'error',
  CANCELLED = 'cancelled',
  PENDING = 'pending',
  ACTION_REQUIRED = 'action_required',
  PARTIALLY_AUTHORIZED = 'partially_authorized',
  CAPTURED = 'captured',
  REFUNDED = 'refunded',
  VOIDED = 'voided',
  RECEIVED = 'received'
}

export enum ErrorCategory {
  AUTHENTICATION_ERROR = 'authentication_error',
  PAYMENT_METHOD_ERROR = 'payment_method_error',
  PROCESSING_ERROR = 'processing_error',
  VALIDATION_ERROR = 'validation_error',
  FRAUD_DECLINE = 'fraud_decline',
  UNKNOWN = 'unknown'
}

export enum ErrorCode {
  CARD_DECLINED = 'card_declined',
  INSUFFICIENT_FUNDS = 'insufficient_funds',
  EXPIRED_CARD = 'expired_card',
  INVALID_CARD = 'invalid_card',
  CVC_DECLINED = 'cvc_declined',
  BLOCKED_CARD = 'blocked_card',
  FRAUD_DETECTED = 'fraud_detected',
  THREE_DS_FAILED = 'three_ds_failed',
  ISSUER_UNAVAILABLE = 'issuer_unavailable',
  NOT_SUPPORTED = 'not_supported',
  ACQUIRER_ERROR = 'acquirer_error',
  PIN_ERROR = 'pin_error',
  CANCELLED_BY_SHOPPER = 'cancelled_by_shopper',
  AVS_DECLINED = 'avs_declined',
  AUTHENTICATION_ERROR = 'authentication_error',
  VALIDATION_ERROR = 'validation_error',
  RATE_LIMIT = 'rate_limit',
  PSP_ERROR = 'psp_error',
  UNKNOWN = 'unknown'
}

export enum RecurringType {
  ONE_TIME = 'one_time',
  CARD_ON_FILE = 'card_on_file',
  SUBSCRIPTION = 'subscription',
  UNSCHEDULED = 'unscheduled'
}

// ============================================================================
// Request Models
// ============================================================================

export interface Amount {
  value: number; // Amount in minor units (e.g., 1000 = $10.00)
  currency: string; // ISO 4217 currency code (e.g., "USD")
}

export interface Source {
  type: SourceType;
  id: string; // Token ID, source ID, or card number depending on type
  storeWithProvider?: boolean;
  holderName?: string;
  number?: string; // Card number (raw_pan and network_token only)
  expiryMonth?: string;
  expiryYear?: string;
  cvc?: string; // CVC (raw_pan only)
  cryptogram?: string; // Network token cryptogram (network_token only)
  eci?: string; // ECI indicator (network_token only)
}

export interface Address {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string; // ISO 3166-1 alpha-2 country code
}

export interface Customer {
  reference?: string; // Your internal customer ID
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
  authenticationValue?: string; // CAVV / authentication value
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

// ============================================================================
// Response Models
// ============================================================================

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

// ============================================================================
// Exceptions
// ============================================================================

export class TransactionError extends Error {
  public readonly response: ErrorResponse;

  constructor(response: ErrorResponse) {
    const errorMessage = response.providerErrors.length > 0 
      ? response.providerErrors.join(', ')
      : 'Transaction failed';
    super(errorMessage);
    this.name = 'TransactionError';
    this.response = response;
  }
}

// ============================================================================
// BIN Information (for routing logic)
// ============================================================================

export interface BinInformation {
  brand?: string; // visa, mastercard, etc.
  type?: string; // credit, debit, prepaid
  category?: string; // consumer, commercial
  countryCode?: string; // ISO 2-letter country code
  issuer?: string; // Bank name
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