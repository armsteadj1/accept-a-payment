/**
 * Unified Payment SDK - Client and Provider Interface
 * Generated from provider interface and client pattern specifications
 */

import {
  Amount,
  TransactionRequest,
  TransactionResponse,
  RefundRequest,
  RefundResponse
} from './models';

// ============================================================================
// Provider Interface
// ============================================================================

export interface PaymentProvider {
  readonly name: string;

  /**
   * Create and authorize a payment
   */
  authorize(
    request: TransactionRequest, 
    idempotencyKey?: string
  ): Promise<TransactionResponse>;

  /**
   * Capture a previously authorized payment
   */
  capture(
    transactionId: string, 
    amount: Amount, 
    reference?: string
  ): Promise<TransactionResponse>;

  /**
   * Retrieve payment details
   */
  get(transactionId: string): Promise<TransactionResponse>;

  /**
   * Refund a captured payment
   */
  refund(
    request: RefundRequest, 
    idempotencyKey?: string
  ): Promise<RefundResponse>;

  /**
   * Cancel / void a payment before capture
   */
  cancel(
    transactionId: string, 
    reference?: string
  ): Promise<TransactionResponse>;
}

// ============================================================================
// Client Wrapper
// ============================================================================

export class PaymentClient {
  private providers: Map<string, PaymentProvider> = new Map();

  constructor(providers: PaymentProvider[]) {
    for (const provider of providers) {
      this.providers.set(provider.name, provider);
    }
  }

  /**
   * Get available provider names
   */
  getProviderNames(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Get a provider by name
   */
  getProvider(name: string): PaymentProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * Create and authorize a payment with the specified provider
   */
  async authorize(
    providerName: string,
    request: TransactionRequest,
    idempotencyKey?: string
  ): Promise<TransactionResponse> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider '${providerName}' not found. Available providers: ${this.getProviderNames().join(', ')}`);
    }
    return provider.authorize(request, idempotencyKey);
  }

  /**
   * Capture a previously authorized payment
   */
  async capture(
    providerName: string,
    transactionId: string,
    amount: Amount,
    reference?: string
  ): Promise<TransactionResponse> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider '${providerName}' not found. Available providers: ${this.getProviderNames().join(', ')}`);
    }
    return provider.capture(transactionId, amount, reference);
  }

  /**
   * Retrieve payment details
   */
  async get(
    providerName: string,
    transactionId: string
  ): Promise<TransactionResponse> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider '${providerName}' not found. Available providers: ${this.getProviderNames().join(', ')}`);
    }
    return provider.get(transactionId);
  }

  /**
   * Refund a captured payment
   */
  async refund(
    providerName: string,
    request: RefundRequest,
    idempotencyKey?: string
  ): Promise<RefundResponse> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider '${providerName}' not found. Available providers: ${this.getProviderNames().join(', ')}`);
    }
    return provider.refund(request, idempotencyKey);
  }

  /**
   * Cancel / void a payment before capture
   */
  async cancel(
    providerName: string,
    transactionId: string,
    reference?: string
  ): Promise<TransactionResponse> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider '${providerName}' not found. Available providers: ${this.getProviderNames().join(', ')}`);
    }
    return provider.cancel(transactionId, reference);
  }
}

// ============================================================================
// HTTP Client Types and Utilities
// ============================================================================

export interface HttpConfig {
  baseUrl: string;
  headers: Record<string, string>;
  timeout?: number;
}

export interface ProxyConfig {
  btApiKey: string;
  btProxyUrl: string;
}

/**
 * Helper to build authentication headers
 */
export function buildAuthHeaders(
  _authType: 'bearer_token' | 'api_key' | 'basic_auth',
  headerName: string,
  headerPrefix: string | undefined,
  credential: string,
  additionalHeaders: Record<string, string> = {}
): Record<string, string> {
  const headers: Record<string, string> = { ...additionalHeaders };
  
  if (headerPrefix) {
    headers[headerName] = `${headerPrefix} ${credential}`;
  } else {
    headers[headerName] = credential;
  }
  
  return headers;
}

/**
 * Helper to flatten objects for form-encoded requests (Stripe)
 */
export function flattenObject(
  obj: any, 
  prefix: string = '', 
  result: Record<string, string> = {}
): Record<string, string> {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}[${key}]` : key;
      
      if (value === null || value === undefined) {
        continue;
      }
      
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === 'object' && item !== null) {
            flattenObject(item, `${newKey}[${index}]`, result);
          } else {
            result[`${newKey}[${index}]`] = String(item);
          }
        });
      } else if (typeof value === 'object' && value !== null) {
        flattenObject(value, newKey, result);
      } else {
        result[newKey] = String(value);
      }
    }
  }
  return result;
}

/**
 * Helper to interpolate path parameters
 */
export function interpolatePath(path: string, params: Record<string, any>): string {
  return path.replace(/\{(\w+)\}/g, (_match, param) => {
    const value = params[param];
    if (value === undefined || value === null) {
      throw new Error(`Missing path parameter: ${param}`);
    }
    return String(value);
  });
}

/**
 * Helper to get nested field value using dot notation
 */
export function getField(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    if (current === null || current === undefined) {
      return undefined;
    }
    // Handle array indices
    const arrayMatch = key.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, arrayKey, index] = arrayMatch;
      return current[arrayKey]?.[parseInt(index, 10)];
    }
    return current[key];
  }, obj);
}

/**
 * Helper to set nested field value using dot notation
 */
export function setField(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  
  const target = keys.reduce((current, key) => {
    if (current[key] === undefined) {
      current[key] = {};
    }
    return current[key];
  }, obj);
  
  target[lastKey] = value;
}