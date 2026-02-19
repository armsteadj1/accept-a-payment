/**
 * Stripe Provider Implementation
 * Generated from stripe.json mapping
 */
import { Amount, TransactionRequest, TransactionResponse, RefundRequest, RefundResponse } from '../models';
import { PaymentProvider } from '../client';
export interface StripeConfig {
    secretKey: string;
    apiVersion?: string;
    isTest?: boolean;
    btApiKey?: string;
}
export declare class StripeProvider implements PaymentProvider {
    readonly name = "stripe";
    private httpClient;
    private config;
    private baseUrl;
    constructor(config: StripeConfig);
    authorize(request: TransactionRequest, idempotencyKey?: string): Promise<TransactionResponse>;
    capture(transactionId: string, amount: Amount, reference?: string): Promise<TransactionResponse>;
    get(transactionId: string): Promise<TransactionResponse>;
    refund(request: RefundRequest, idempotencyKey?: string): Promise<RefundResponse>;
    cancel(transactionId: string, reference?: string): Promise<TransactionResponse>;
    private applySourceTransform;
    private executeRequest;
    private executeDirectRequest;
    private executeBasisTheoryProxyRequest;
    private transformTransactionResponse;
    private transformRefundResponse;
    private mapStatus;
    private mapErrorCode;
    private handleError;
}
