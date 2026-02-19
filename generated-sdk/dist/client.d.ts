/**
 * Unified Payment SDK - Client and Provider Interface
 * Generated from provider interface and client pattern specifications
 */
import { Amount, TransactionRequest, TransactionResponse, RefundRequest, RefundResponse } from './models';
export interface PaymentProvider {
    readonly name: string;
    /**
     * Create and authorize a payment
     */
    authorize(request: TransactionRequest, idempotencyKey?: string): Promise<TransactionResponse>;
    /**
     * Capture a previously authorized payment
     */
    capture(transactionId: string, amount: Amount, reference?: string): Promise<TransactionResponse>;
    /**
     * Retrieve payment details
     */
    get(transactionId: string): Promise<TransactionResponse>;
    /**
     * Refund a captured payment
     */
    refund(request: RefundRequest, idempotencyKey?: string): Promise<RefundResponse>;
    /**
     * Cancel / void a payment before capture
     */
    cancel(transactionId: string, reference?: string): Promise<TransactionResponse>;
}
export declare class PaymentClient {
    private providers;
    constructor(providers: PaymentProvider[]);
    /**
     * Get available provider names
     */
    getProviderNames(): string[];
    /**
     * Get a provider by name
     */
    getProvider(name: string): PaymentProvider | undefined;
    /**
     * Create and authorize a payment with the specified provider
     */
    authorize(providerName: string, request: TransactionRequest, idempotencyKey?: string): Promise<TransactionResponse>;
    /**
     * Capture a previously authorized payment
     */
    capture(providerName: string, transactionId: string, amount: Amount, reference?: string): Promise<TransactionResponse>;
    /**
     * Retrieve payment details
     */
    get(providerName: string, transactionId: string): Promise<TransactionResponse>;
    /**
     * Refund a captured payment
     */
    refund(providerName: string, request: RefundRequest, idempotencyKey?: string): Promise<RefundResponse>;
    /**
     * Cancel / void a payment before capture
     */
    cancel(providerName: string, transactionId: string, reference?: string): Promise<TransactionResponse>;
}
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
export declare function buildAuthHeaders(_authType: 'bearer_token' | 'api_key' | 'basic_auth', headerName: string, headerPrefix: string | undefined, credential: string, additionalHeaders?: Record<string, string>): Record<string, string>;
/**
 * Helper to flatten objects for form-encoded requests (Stripe)
 */
export declare function flattenObject(obj: any, prefix?: string, result?: Record<string, string>): Record<string, string>;
/**
 * Helper to interpolate path parameters
 */
export declare function interpolatePath(path: string, params: Record<string, any>): string;
/**
 * Helper to get nested field value using dot notation
 */
export declare function getField(obj: any, path: string): any;
/**
 * Helper to set nested field value using dot notation
 */
export declare function setField(obj: any, path: string, value: any): void;
