/**
 * Stripe Provider Implementation
 * Generated from stripe.json mapping
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  Amount,
  TransactionRequest,
  TransactionResponse,
  RefundRequest,
  RefundResponse,
  TransactionError,
  ErrorResponse,
  ErrorCategory,
  ErrorCode,
  TransactionStatus,
  SourceType,
  ResponseCode
} from '../models';
import {
  PaymentProvider,
  flattenObject,
  interpolatePath,
  getField,
  setField
} from '../client';

export interface StripeConfig {
  secretKey: string;
  apiVersion?: string;
  isTest?: boolean;
  btApiKey?: string; // For Basis Theory proxy
}

export class StripeProvider implements PaymentProvider {
  public readonly name = 'stripe';
  
  private httpClient: AxiosInstance;
  private config: StripeConfig;
  private baseUrl: string;

  constructor(config: StripeConfig) {
    this.config = config;
    this.baseUrl = 'https://api.stripe.com';
    
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${config.secretKey}`,
        ...(config.apiVersion && { 'Stripe-Version': config.apiVersion })
      }
    });
  }

  async authorize(request: TransactionRequest, idempotencyKey?: string): Promise<TransactionResponse> {
    const operation = {
      method: 'POST',
      path: '/v1/payment_intents'
    };

    // Build request payload
    let payload: any = {
      amount: request.amount.value,
      currency: request.amount.currency,
      confirm: true,
      capture_method: 'manual',
      payment_method_types: ['card']
    };

    // Apply source-type-specific transform
    this.applySourceTransform(payload, request.source);

    // Apply base request mapping
    if (request.reference) {
      setField(payload, 'metadata.reference', request.reference);
    }
    if (request.customer?.reference) {
      payload.customer = request.customer.reference;
    }
    if (request.customer?.email) {
      payload.receipt_email = request.customer.email;
    }
    if (request.merchantInitiated !== undefined) {
      payload.off_session = request.merchantInitiated;
    }
    if (request.source.storeWithProvider) {
      payload.setup_future_usage = 'off_session';
    }
    if (request.statementDescription?.name) {
      payload.statement_descriptor = request.statementDescription.name;
    }
    if (request.metadata) {
      payload.metadata = { ...payload.metadata, ...request.metadata };
    }
    if (request.previousNetworkTransactionId) {
      setField(payload, 'payment_method_options.card.mit_exemption.network_transaction_id', request.previousNetworkTransactionId);
    }

    // Apply 3DS fields
    if (request.threeDs) {
      if (request.threeDs.authenticationValue) {
        setField(payload, 'payment_method_options.card.three_d_secure.cryptogram', request.threeDs.authenticationValue);
      }
      if (request.threeDs.eci) {
        setField(payload, 'payment_method_options.card.three_d_secure.electronic_commerce_indicator', request.threeDs.eci);
      }
      if (request.threeDs.dsTransactionId) {
        setField(payload, 'payment_method_options.card.three_d_secure.transaction_id', request.threeDs.dsTransactionId);
      }
      if (request.threeDs.version) {
        setField(payload, 'payment_method_options.card.three_d_secure.version', request.threeDs.version);
      }
    }

    try {
      const response = await this.executeRequest(operation.method, operation.path, payload, idempotencyKey, request.source.type);
      return this.transformTransactionResponse(response.data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async capture(transactionId: string, amount: Amount, reference?: string): Promise<TransactionResponse> {
    const operation = {
      method: 'POST',
      path: '/v1/payment_intents/{transaction_id}/capture'
    };

    let payload: any = {
      amount_to_capture: amount.value
    };

    if (reference) {
      setField(payload, 'metadata.reference', reference);
    }

    try {
      const path = interpolatePath(operation.path, { transaction_id: transactionId });
      const response = await this.executeRequest(operation.method, path, payload);
      return this.transformTransactionResponse(response.data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async get(transactionId: string): Promise<TransactionResponse> {
    const operation = {
      method: 'GET',
      path: '/v1/payment_intents/{transaction_id}'
    };

    try {
      const path = interpolatePath(operation.path, { transaction_id: transactionId });
      const response = await this.executeRequest(operation.method, path, {});
      return this.transformTransactionResponse(response.data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async refund(request: RefundRequest, idempotencyKey?: string): Promise<RefundResponse> {
    const operation = {
      method: 'POST',
      path: '/v1/refunds'
    };

    let payload: any = {
      payment_intent: request.originalTransactionId,
      amount: request.amount.value
    };

    if (request.reason) {
      payload.reason = request.reason;
    }

    try {
      const response = await this.executeRequest(operation.method, operation.path, payload, idempotencyKey);
      return this.transformRefundResponse(response.data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async cancel(transactionId: string, reference?: string): Promise<TransactionResponse> {
    const operation = {
      method: 'POST',
      path: '/v1/payment_intents/{transaction_id}/cancel'
    };

    let payload: any = {};

    if (reference) {
      payload.cancellation_reason = reference;
    }

    try {
      const path = interpolatePath(operation.path, { transaction_id: transactionId });
      const response = await this.executeRequest(operation.method, path, payload);
      return this.transformTransactionResponse(response.data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private applySourceTransform(payload: any, source: any): void {
    switch (source.type) {
      case SourceType.RAW_PAN:
        setField(payload, 'payment_method_data.type', 'card');
        setField(payload, 'payment_method_data.card.number', source.number);
        setField(payload, 'payment_method_data.card.exp_month', source.expiryMonth);
        setField(payload, 'payment_method_data.card.exp_year', source.expiryYear);
        setField(payload, 'payment_method_data.card.cvc', source.cvc);
        break;
        
      case SourceType.BASIS_THEORY_TOKEN:
      case SourceType.BASIS_THEORY_TOKEN_INTENT:
        // For BT tokens, the transform expressions are handled by the proxy
        setField(payload, 'payment_method_data.type', 'card');
        setField(payload, 'payment_method_data.card.number', `{{ token: ${source.id} | json: '$.data.number' }}`);
        setField(payload, 'payment_method_data.card.exp_month', `{{ token: ${source.id} | json: '$.data.expiration_month' }}`);
        setField(payload, 'payment_method_data.card.exp_year', `{{ token: ${source.id} | json: '$.data.expiration_year' }}`);
        setField(payload, 'payment_method_data.card.cvc', `{{ token: ${source.id} | json: '$.data.cvc' }}`);
        break;
        
      case SourceType.NETWORK_TOKEN:
        setField(payload, 'payment_method_data.type', 'card');
        setField(payload, 'payment_method_data.card.number', source.number);
        setField(payload, 'payment_method_data.card.exp_month', source.expiryMonth);
        setField(payload, 'payment_method_data.card.exp_year', source.expiryYear);
        if (source.cryptogram) {
          setField(payload, 'payment_method_options.card.three_d_secure.cryptogram', source.cryptogram);
        }
        if (source.eci) {
          setField(payload, 'payment_method_options.card.three_d_secure.electronic_commerce_indicator', source.eci);
        }
        break;
        
      case SourceType.PROCESSOR_TOKEN:
        payload.payment_method = source.id;
        break;
    }

    if (source.holderName && source.type !== SourceType.PROCESSOR_TOKEN) {
      setField(payload, 'payment_method_data.billing_details.name', source.holderName);
    }
  }

  private async executeRequest(
    method: string, 
    path: string, 
    payload: any, 
    idempotencyKey?: string,
    sourceType?: SourceType
  ): Promise<AxiosResponse> {
    const headers: Record<string, string> = {};
    
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    // Check if we need to use BT proxy
    const needsProxy = sourceType === SourceType.BASIS_THEORY_TOKEN || 
                       sourceType === SourceType.BASIS_THEORY_TOKEN_INTENT;

    if (needsProxy && this.config.btApiKey) {
      return this.executeBasisTheoryProxyRequest(method, path, payload, headers);
    } else {
      return this.executeDirectRequest(method, path, payload, headers);
    }
  }

  private async executeDirectRequest(
    method: string,
    path: string,
    payload: any,
    additionalHeaders: Record<string, string>
  ): Promise<AxiosResponse> {
    const url = `${this.baseUrl}${path}`;
    
    // Flatten payload for form encoding
    const formData = flattenObject(payload);
    const body = new URLSearchParams(formData).toString();

    return this.httpClient.request({
      method,
      url,
      data: body,
      headers: {
        ...additionalHeaders,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
  }

  private async executeBasisTheoryProxyRequest(
    method: string,
    path: string,
    payload: any,
    additionalHeaders: Record<string, string>
  ): Promise<AxiosResponse> {
    const proxyUrl = 'https://api.basistheory.com/proxy';
    const targetUrl = `${this.baseUrl}${path}`;
    
    // Flatten payload for form encoding
    const formData = flattenObject(payload);
    const body = new URLSearchParams(formData).toString();

    return axios.request({
      method,
      url: proxyUrl,
      data: body,
      headers: {
        'BT-API-KEY': this.config.btApiKey!,
        'BT-PROXY-URL': targetUrl,
        'Authorization': `Bearer ${this.config.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        ...(this.config.apiVersion && { 'Stripe-Version': this.config.apiVersion }),
        ...additionalHeaders
      }
    });
  }

  private transformTransactionResponse(responseData: any): TransactionResponse {
    const status = this.mapStatus(responseData.status);
    const responseCode = this.mapErrorCode(getField(responseData, 'last_payment_error.decline_code'));

    return {
      id: responseData.id,
      reference: getField(responseData, 'metadata.reference'),
      amount: {
        value: responseData.amount,
        currency: responseData.currency
      },
      status: {
        code: status,
        providerCode: responseData.status
      },
      responseCode,
      source: responseData.payment_method ? {
        type: SourceType.PROCESSOR_TOKEN,
        id: responseData.payment_method,
        provisioned: { id: responseData.payment_method }
      } : undefined,
      networkTransactionId: getField(responseData, 'charges.data[0].network_transaction_id'),
      fullProviderResponse: responseData,
      createdAt: new Date(responseData.created * 1000).toISOString()
    };
  }

  private transformRefundResponse(responseData: any): RefundResponse {
    return {
      id: responseData.id,
      reference: getField(responseData, 'metadata.reference') || '',
      amount: {
        value: responseData.amount,
        currency: responseData.currency
      },
      status: {
        code: TransactionStatus.REFUNDED,
        providerCode: responseData.status
      },
      refundedTransactionId: responseData.payment_intent,
      fullProviderResponse: responseData,
      createdAt: new Date(responseData.created * 1000).toISOString()
    };
  }

  private mapStatus(stripeStatus: string): TransactionStatus {
    const statusMappings: Record<string, TransactionStatus> = {
      'requires_capture': TransactionStatus.AUTHORIZED,
      'succeeded': TransactionStatus.CAPTURED,
      'requires_action': TransactionStatus.ACTION_REQUIRED,
      'requires_confirmation': TransactionStatus.PENDING,
      'processing': TransactionStatus.PENDING,
      'canceled': TransactionStatus.CANCELLED,
      'requires_payment_method': TransactionStatus.DECLINED
    };

    return statusMappings[stripeStatus] || TransactionStatus.DECLINED;
  }

  private mapErrorCode(declineCode: string): ResponseCode | undefined {
    if (!declineCode) return undefined;

    const errorMappings: Record<string, { category: ErrorCategory; code: ErrorCode }> = {
      // Card declined codes
      'generic_decline': { category: ErrorCategory.PROCESSING_ERROR, code: ErrorCode.CARD_DECLINED },
      'do_not_honor': { category: ErrorCategory.PROCESSING_ERROR, code: ErrorCode.CARD_DECLINED },
      'insufficient_funds': { category: ErrorCategory.PAYMENT_METHOD_ERROR, code: ErrorCode.INSUFFICIENT_FUNDS },
      'expired_card': { category: ErrorCategory.PAYMENT_METHOD_ERROR, code: ErrorCode.EXPIRED_CARD },
      'incorrect_cvc': { category: ErrorCategory.PAYMENT_METHOD_ERROR, code: ErrorCode.CVC_DECLINED },
      'incorrect_number': { category: ErrorCategory.PAYMENT_METHOD_ERROR, code: ErrorCode.INVALID_CARD },
      'fraudulent': { category: ErrorCategory.FRAUD_DECLINE, code: ErrorCode.FRAUD_DETECTED },
      'lost_card': { category: ErrorCategory.PAYMENT_METHOD_ERROR, code: ErrorCode.BLOCKED_CARD },
      'stolen_card': { category: ErrorCategory.PAYMENT_METHOD_ERROR, code: ErrorCode.BLOCKED_CARD },
      'authentication_required': { category: ErrorCategory.AUTHENTICATION_ERROR, code: ErrorCode.THREE_DS_FAILED }
    };

    return errorMappings[declineCode] || {
      category: ErrorCategory.UNKNOWN,
      code: ErrorCode.UNKNOWN
    };
  }

  private handleError(error: any): TransactionError {
    let errorResponse: ErrorResponse;

    if (error.response) {
      // HTTP error response
      const responseData = error.response.data;
      const httpStatus = error.response.status;

      const errorCodes: ResponseCode[] = [];
      const providerErrors: string[] = [];

      if (responseData.error) {
        providerErrors.push(responseData.error.message);
        
        if (responseData.error.decline_code) {
          const mappedError = this.mapErrorCode(responseData.error.decline_code);
          if (mappedError) {
            errorCodes.push(mappedError);
          }
        }
      }

      // Fall back to HTTP status mapping
      if (errorCodes.length === 0) {
        const httpErrorMapping: Record<number, { category: ErrorCategory; code: ErrorCode }> = {
          401: { category: ErrorCategory.AUTHENTICATION_ERROR, code: ErrorCode.AUTHENTICATION_ERROR },
          403: { category: ErrorCategory.AUTHENTICATION_ERROR, code: ErrorCode.AUTHENTICATION_ERROR },
          400: { category: ErrorCategory.VALIDATION_ERROR, code: ErrorCode.VALIDATION_ERROR },
          429: { category: ErrorCategory.PROCESSING_ERROR, code: ErrorCode.RATE_LIMIT },
          500: { category: ErrorCategory.PROCESSING_ERROR, code: ErrorCode.PSP_ERROR }
        };

        const mappedError = httpErrorMapping[httpStatus];
        if (mappedError) {
          errorCodes.push(mappedError);
        } else {
          errorCodes.push({ category: ErrorCategory.UNKNOWN, code: ErrorCode.UNKNOWN });
        }
      }

      errorResponse = {
        errorCodes,
        providerErrors,
        fullProviderResponse: responseData
      };
    } else {
      // Network or other error
      errorResponse = {
        errorCodes: [{ category: ErrorCategory.PROCESSING_ERROR, code: ErrorCode.PSP_ERROR }],
        providerErrors: [error.message || 'Network error occurred'],
        fullProviderResponse: null
      };
    }

    return new TransactionError(errorResponse);
  }
}