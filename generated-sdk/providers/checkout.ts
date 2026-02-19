/**
 * Checkout.com Provider Implementation
 * Generated from checkout.json mapping
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
  interpolatePath
} from '../client';

export interface CheckoutConfig {
  secretKey: string;
  processingChannelId: string;
  isTest?: boolean;
  btApiKey?: string; // For Basis Theory proxy
}

export class CheckoutProvider implements PaymentProvider {
  public readonly name = 'checkout';
  
  private httpClient: AxiosInstance;
  private config: CheckoutConfig;
  private baseUrl: string;

  constructor(config: CheckoutConfig) {
    this.config = config;
    this.baseUrl = config.isTest 
      ? 'https://api.sandbox.checkout.com'
      : 'https://api.checkout.com';
    
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.secretKey}`
      }
    });
  }

  async authorize(request: TransactionRequest, idempotencyKey?: string): Promise<TransactionResponse> {
    const operation = {
      method: 'POST',
      path: '/payments'
    };

    // Build request payload
    let payload: any = {
      amount: request.amount.value,
      currency: request.amount.currency,
      capture: false, // Authorization only
      processing_channel_id: this.config.processingChannelId
    };

    // Apply source-type-specific transform
    this.applySourceTransform(payload, request.source);

    // Apply base request mapping
    if (request.reference) {
      payload.reference = request.reference;
    }
    if (request.merchantInitiated !== undefined) {
      payload.merchant_initiated = request.merchantInitiated;
    }
    if (request.customer) {
      if (request.customer.firstName) {
        payload.customer = payload.customer || {};
        payload.customer.name = request.customer.firstName;
      }
      if (request.customer.email) {
        payload.customer = payload.customer || {};
        payload.customer.email = request.customer.email;
      }
    }

    // Apply billing address
    if (request.customer?.address) {
      const address = request.customer.address;
      payload.source = payload.source || {};
      payload.source.billing_address = {};
      if (address.addressLine1) payload.source.billing_address.address_line1 = address.addressLine1;
      if (address.addressLine2) payload.source.billing_address.address_line2 = address.addressLine2;
      if (address.city) payload.source.billing_address.city = address.city;
      if (address.state) payload.source.billing_address.state = address.state;
      if (address.zip) payload.source.billing_address.zip = address.zip;
      if (address.country) payload.source.billing_address.country = address.country;
    }

    if (request.statementDescription) {
      payload.billing_descriptor = {};
      if (request.statementDescription.name) {
        payload.billing_descriptor.name = request.statementDescription.name;
      }
      if (request.statementDescription.city) {
        payload.billing_descriptor.city = request.statementDescription.city;
      }
    }

    if (request.metadata) {
      payload.metadata = request.metadata;
    }

    if (request.previousNetworkTransactionId) {
      payload.previous_payment_id = request.previousNetworkTransactionId;
    }

    // Apply 3DS fields
    if (request.threeDs) {
      payload['3ds'] = {};
      if (request.threeDs.authenticationValue) {
        payload['3ds'].cryptogram = request.threeDs.authenticationValue;
      }
      if (request.threeDs.eci) {
        payload['3ds'].eci = request.threeDs.eci;
      }
      if (request.threeDs.dsTransactionId) {
        payload['3ds'].xid = request.threeDs.dsTransactionId;
      }
      if (request.threeDs.version) {
        payload['3ds'].version = request.threeDs.version;
      }
      if (request.threeDs.authenticationStatusCode) {
        payload['3ds'].status = request.threeDs.authenticationStatusCode;
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
      path: '/payments/{transaction_id}/captures'
    };

    let payload: any = {
      amount: amount.value,
      currency: amount.currency
    };

    if (reference) {
      payload.reference = reference;
    }

    try {
      const path = interpolatePath(operation.path, { transaction_id: transactionId });
      const response = await this.executeRequest(operation.method, path, payload);
      return this.transformCaptureResponse(response.data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async get(transactionId: string): Promise<TransactionResponse> {
    const operation = {
      method: 'GET',
      path: '/payments/{transaction_id}'
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
      path: '/payments/{transaction_id}/refunds'
    };

    let payload: any = {
      amount: request.amount.value,
      currency: request.amount.currency,
      reference: request.reference
    };

    try {
      const path = interpolatePath(operation.path, { transaction_id: request.originalTransactionId });
      const response = await this.executeRequest(operation.method, path, payload, idempotencyKey);
      return this.transformRefundResponse(response.data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async cancel(transactionId: string, reference?: string): Promise<TransactionResponse> {
    const operation = {
      method: 'POST',
      path: '/payments/{transaction_id}/voids'
    };

    let payload: any = {};

    if (reference) {
      payload.reference = reference;
    }

    try {
      const path = interpolatePath(operation.path, { transaction_id: transactionId });
      const response = await this.executeRequest(operation.method, path, payload);
      return this.transformCancelResponse(response.data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private applySourceTransform(payload: any, source: any): void {
    payload.source = {};

    switch (source.type) {
      case SourceType.RAW_PAN:
        payload.source.type = 'card';
        payload.source.number = source.number;
        payload.source.expiry_month = source.expiryMonth;
        payload.source.expiry_year = source.expiryYear;
        payload.source.cvv = source.cvc;
        if (source.holderName) {
          payload.source.name = source.holderName;
        }
        if (source.storeWithProvider) {
          payload.source.store_for_future_use = source.storeWithProvider;
        }
        break;
        
      case SourceType.BASIS_THEORY_TOKEN:
      case SourceType.BASIS_THEORY_TOKEN_INTENT:
        // For BT tokens, the transform expressions are handled by the proxy
        payload.source.type = 'card';
        payload.source.number = `{{ token: ${source.id} | json: '$.data.number' }}`;
        payload.source.expiry_month = `{{ token: ${source.id} | json: '$.data.expiration_month' }}`;
        payload.source.expiry_year = `{{ token: ${source.id} | json: '$.data.expiration_year' }}`;
        payload.source.cvv = `{{ token: ${source.id} | json: '$.data.cvc' }}`;
        if (source.holderName) {
          payload.source.name = source.holderName;
        }
        if (source.storeWithProvider) {
          payload.source.store_for_future_use = source.storeWithProvider;
        }
        break;
        
      case SourceType.NETWORK_TOKEN:
        payload.source.type = 'network_token';
        payload.source.token = source.number;
        payload.source.expiry_month = source.expiryMonth;
        payload.source.expiry_year = source.expiryYear;
        if (source.cryptogram) {
          payload.source.cryptogram = source.cryptogram;
        }
        if (source.eci) {
          payload.source.eci = source.eci;
        }
        break;
        
      case SourceType.PROCESSOR_TOKEN:
        payload.source.type = 'id';
        payload.source.id = source.id;
        break;
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
      headers['Cko-Idempotency-Key'] = idempotencyKey;
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
    return this.httpClient.request({
      method,
      url: path,
      data: payload,
      headers: additionalHeaders
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

    return axios.request({
      method,
      url: proxyUrl,
      data: payload,
      headers: {
        'BT-API-KEY': this.config.btApiKey!,
        'BT-PROXY-URL': targetUrl,
        'Authorization': `Bearer ${this.config.secretKey}`,
        'Content-Type': 'application/json',
        ...additionalHeaders
      }
    });
  }

  private transformTransactionResponse(responseData: any): TransactionResponse {
    const status = this.mapStatus(responseData.status);
    const responseCode = this.mapErrorCode(responseData.response_code);

    return {
      id: responseData.id,
      reference: responseData.reference,
      amount: {
        value: responseData.amount,
        currency: responseData.currency
      },
      status: {
        code: status,
        providerCode: responseData.status
      },
      responseCode,
      source: responseData.source?.id ? {
        type: SourceType.PROCESSOR_TOKEN,
        id: responseData.source.id,
        provisioned: { id: responseData.source.id }
      } : undefined,
      networkTransactionId: responseData.scheme_id,
      fullProviderResponse: responseData,
      createdAt: responseData.processed_on || new Date().toISOString()
    };
  }

  private transformCaptureResponse(responseData: any): TransactionResponse {
    return {
      id: responseData.action_id,
      reference: responseData.reference,
      amount: {
        value: responseData.amount || 0,
        currency: responseData.currency || 'USD'
      },
      status: {
        code: TransactionStatus.CAPTURED,
        providerCode: 'Captured'
      },
      fullProviderResponse: responseData,
      createdAt: new Date().toISOString()
    };
  }

  private transformRefundResponse(responseData: any): RefundResponse {
    return {
      id: responseData.action_id,
      reference: responseData.reference || '',
      amount: {
        value: responseData.amount,
        currency: responseData.currency
      },
      status: {
        code: TransactionStatus.REFUNDED,
        providerCode: 'Refunded'
      },
      fullProviderResponse: responseData,
      createdAt: new Date().toISOString()
    };
  }

  private transformCancelResponse(responseData: any): TransactionResponse {
    return {
      id: responseData.action_id,
      reference: responseData.reference,
      amount: {
        value: 0,
        currency: 'USD'
      },
      status: {
        code: TransactionStatus.VOIDED,
        providerCode: 'Voided'
      },
      fullProviderResponse: responseData,
      createdAt: new Date().toISOString()
    };
  }

  private mapStatus(checkoutStatus: string): TransactionStatus {
    const statusMappings: Record<string, TransactionStatus> = {
      'Authorized': TransactionStatus.AUTHORIZED,
      'Pending': TransactionStatus.PENDING,
      'Card Verified': TransactionStatus.AUTHORIZED,
      'Declined': TransactionStatus.DECLINED,
      'Retry Scheduled': TransactionStatus.PENDING,
      'Captured': TransactionStatus.CAPTURED,
      'Partially Captured': TransactionStatus.CAPTURED,
      'Refunded': TransactionStatus.REFUNDED,
      'Partially Refunded': TransactionStatus.REFUNDED,
      'Voided': TransactionStatus.VOIDED,
      'Canceled': TransactionStatus.CANCELLED,
      'Expired': TransactionStatus.CANCELLED
    };

    return statusMappings[checkoutStatus] || TransactionStatus.DECLINED;
  }

  private mapErrorCode(responseCode: string | number): ResponseCode | undefined {
    if (!responseCode) return undefined;

    const code = String(responseCode);
    const errorMappings: Record<string, { category: ErrorCategory; code: ErrorCode }> = {
      // Card declined codes
      '20005': { category: ErrorCategory.PROCESSING_ERROR, code: ErrorCode.CARD_DECLINED },
      '20108': { category: ErrorCategory.PROCESSING_ERROR, code: ErrorCode.CARD_DECLINED },
      
      // Insufficient funds
      '20051': { category: ErrorCategory.PAYMENT_METHOD_ERROR, code: ErrorCode.INSUFFICIENT_FUNDS },
      '20061': { category: ErrorCategory.PAYMENT_METHOD_ERROR, code: ErrorCode.INSUFFICIENT_FUNDS },
      
      // Expired card
      '20054': { category: ErrorCategory.PAYMENT_METHOD_ERROR, code: ErrorCode.EXPIRED_CARD },
      '30033': { category: ErrorCategory.PAYMENT_METHOD_ERROR, code: ErrorCode.EXPIRED_CARD },
      
      // Invalid card
      '20014': { category: ErrorCategory.PAYMENT_METHOD_ERROR, code: ErrorCode.INVALID_CARD },
      '20039': { category: ErrorCategory.PAYMENT_METHOD_ERROR, code: ErrorCode.INVALID_CARD },
      
      // CVC declined
      '20082': { category: ErrorCategory.PAYMENT_METHOD_ERROR, code: ErrorCode.CVC_DECLINED },
      '20124': { category: ErrorCategory.PAYMENT_METHOD_ERROR, code: ErrorCode.CVC_DECLINED },
      
      // Blocked card
      '20004': { category: ErrorCategory.PAYMENT_METHOD_ERROR, code: ErrorCode.BLOCKED_CARD },
      '20067': { category: ErrorCategory.PAYMENT_METHOD_ERROR, code: ErrorCode.BLOCKED_CARD },
      
      // Fraud detected
      '20059': { category: ErrorCategory.FRAUD_DECLINE, code: ErrorCode.FRAUD_DETECTED },
      '20063': { category: ErrorCategory.FRAUD_DECLINE, code: ErrorCode.FRAUD_DETECTED },
      
      // 3DS failed
      '20150': { category: ErrorCategory.AUTHENTICATION_ERROR, code: ErrorCode.THREE_DS_FAILED },
      '20151': { category: ErrorCategory.AUTHENTICATION_ERROR, code: ErrorCode.THREE_DS_FAILED },
      
      // Issuer unavailable
      '20091': { category: ErrorCategory.PROCESSING_ERROR, code: ErrorCode.ISSUER_UNAVAILABLE }
    };

    return errorMappings[code] || {
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

      // Extract error codes from response
      if (responseData.error_codes && Array.isArray(responseData.error_codes)) {
        for (const errorCode of responseData.error_codes) {
          const mappedError = this.mapErrorCode(errorCode);
          if (mappedError) {
            errorCodes.push(mappedError);
          }
          providerErrors.push(String(errorCode));
        }
      }

      if (responseData.response_code) {
        const mappedError = this.mapErrorCode(responseData.response_code);
        if (mappedError) {
          errorCodes.push(mappedError);
        }
      }

      if (responseData.error_type) {
        providerErrors.push(responseData.error_type);
      }

      // Fall back to HTTP status mapping
      if (errorCodes.length === 0) {
        const httpErrorMapping: Record<number, { category: ErrorCategory; code: ErrorCode }> = {
          401: { category: ErrorCategory.AUTHENTICATION_ERROR, code: ErrorCode.AUTHENTICATION_ERROR },
          403: { category: ErrorCategory.AUTHENTICATION_ERROR, code: ErrorCode.AUTHENTICATION_ERROR },
          404: { category: ErrorCategory.PROCESSING_ERROR, code: ErrorCode.PSP_ERROR },
          422: { category: ErrorCategory.VALIDATION_ERROR, code: ErrorCode.VALIDATION_ERROR },
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