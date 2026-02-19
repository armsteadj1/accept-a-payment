/**
 * Checkout.com Provider Implementation
 * Generated from checkout.json mapping
 */
import { Amount, TransactionRequest, TransactionResponse, RefundRequest, RefundResponse } from '../models';
import { PaymentProvider } from '../client';
export interface CheckoutConfig {
    secretKey: string;
    processingChannelId: string;
    isTest?: boolean;
    btApiKey?: string;
}
export declare class CheckoutProvider implements PaymentProvider {
    readonly name = "checkout";
    private httpClient;
    private config;
    private baseUrl;
    constructor(config: CheckoutConfig);
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
    private transformCaptureResponse;
    private transformRefundResponse;
    private transformCancelResponse;
    private mapStatus;
    private mapErrorCode;
    private handleError;
}
