/**
 * Unified Payment SDK - Entry Point
 * Generated TypeScript SDK for multiple payment service providers
 */

// Export all types and models
export * from './models';

// Export client and provider interface
export * from './client';

// Export provider implementations
export { StripeProvider } from './providers/stripe';
export type { StripeConfig } from './providers/stripe';
export { CheckoutProvider } from './providers/checkout';
export type { CheckoutConfig } from './providers/checkout';

import { PaymentClient } from './client';
import { StripeProvider } from './providers/stripe';
import { CheckoutProvider } from './providers/checkout';

// Re-export commonly used types for convenience
export type {
  Amount,
  TransactionRequest,
  TransactionResponse,
  RefundRequest,
  RefundResponse,
  Source,
  Customer,
  Address,
  BinInformation,
  TokenInformation,
  ErrorResponse
} from './models';

export {
  SourceType,
  TransactionStatus,
  ErrorCategory,
  ErrorCode,
  RecurringType,
  TransactionError
} from './models';

export {
  PaymentClient
} from './client';

export type {
  PaymentProvider
} from './client';

// Helper function to create a payment client with common providers
export function createPaymentClient(config: {
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
}): PaymentClient {
  const providers = [];

  if (config.stripe) {
    providers.push(new StripeProvider(config.stripe));
  }

  if (config.checkout) {
    providers.push(new CheckoutProvider(config.checkout));
  }

  return new PaymentClient(providers);
}

// Version information
export const SDK_VERSION = '1.0.0';
export const SDK_NAME = 'unified-payment-sdk';