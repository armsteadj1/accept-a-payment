/**
 * Unified Payment SDK - Entry Point
 * Generated TypeScript SDK for multiple payment service providers
 */
export * from './models';
export * from './client';
export { StripeProvider } from './providers/stripe';
export type { StripeConfig } from './providers/stripe';
export { CheckoutProvider } from './providers/checkout';
export type { CheckoutConfig } from './providers/checkout';
import { PaymentClient } from './client';
export type { Amount, TransactionRequest, TransactionResponse, RefundRequest, RefundResponse, Source, Customer, Address, BinInformation, TokenInformation, ErrorResponse } from './models';
export { SourceType, TransactionStatus, ErrorCategory, ErrorCode, RecurringType, TransactionError } from './models';
export { PaymentClient } from './client';
export type { PaymentProvider } from './client';
export declare function createPaymentClient(config: {
    stripe?: {
        secretKey: string;
        apiVersion?: string;
        isTest?: boolean;
        btApiKey?: string;
    };
    checkout?: {
        secretKey: string;
        processingChannelId: string;
        isTest?: boolean;
        btApiKey?: string;
    };
}): PaymentClient;
export declare const SDK_VERSION = "1.0.0";
export declare const SDK_NAME = "unified-payment-sdk";
