"use strict";
/**
 * Checkout.com Provider Implementation
 * Generated from checkout.json mapping
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckoutProvider = void 0;
const axios_1 = __importDefault(require("axios"));
const models_1 = require("../models");
const client_1 = require("../client");
class CheckoutProvider {
    constructor(config) {
        this.name = 'checkout';
        this.config = config;
        this.baseUrl = config.isTest
            ? 'https://api.sandbox.checkout.com'
            : 'https://api.checkout.com';
        this.httpClient = axios_1.default.create({
            baseURL: this.baseUrl,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.secretKey}`
            }
        });
    }
    async authorize(request, idempotencyKey) {
        const operation = {
            method: 'POST',
            path: '/payments'
        };
        // Build request payload
        let payload = {
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
            if (address.addressLine1)
                payload.source.billing_address.address_line1 = address.addressLine1;
            if (address.addressLine2)
                payload.source.billing_address.address_line2 = address.addressLine2;
            if (address.city)
                payload.source.billing_address.city = address.city;
            if (address.state)
                payload.source.billing_address.state = address.state;
            if (address.zip)
                payload.source.billing_address.zip = address.zip;
            if (address.country)
                payload.source.billing_address.country = address.country;
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
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
    async capture(transactionId, amount, reference) {
        const operation = {
            method: 'POST',
            path: '/payments/{transaction_id}/captures'
        };
        let payload = {
            amount: amount.value,
            currency: amount.currency
        };
        if (reference) {
            payload.reference = reference;
        }
        try {
            const path = (0, client_1.interpolatePath)(operation.path, { transaction_id: transactionId });
            const response = await this.executeRequest(operation.method, path, payload);
            return this.transformCaptureResponse(response.data);
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
    async get(transactionId) {
        const operation = {
            method: 'GET',
            path: '/payments/{transaction_id}'
        };
        try {
            const path = (0, client_1.interpolatePath)(operation.path, { transaction_id: transactionId });
            const response = await this.executeRequest(operation.method, path, {});
            return this.transformTransactionResponse(response.data);
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
    async refund(request, idempotencyKey) {
        const operation = {
            method: 'POST',
            path: '/payments/{transaction_id}/refunds'
        };
        let payload = {
            amount: request.amount.value,
            currency: request.amount.currency,
            reference: request.reference
        };
        try {
            const path = (0, client_1.interpolatePath)(operation.path, { transaction_id: request.originalTransactionId });
            const response = await this.executeRequest(operation.method, path, payload, idempotencyKey);
            return this.transformRefundResponse(response.data);
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
    async cancel(transactionId, reference) {
        const operation = {
            method: 'POST',
            path: '/payments/{transaction_id}/voids'
        };
        let payload = {};
        if (reference) {
            payload.reference = reference;
        }
        try {
            const path = (0, client_1.interpolatePath)(operation.path, { transaction_id: transactionId });
            const response = await this.executeRequest(operation.method, path, payload);
            return this.transformCancelResponse(response.data);
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
    applySourceTransform(payload, source) {
        payload.source = {};
        switch (source.type) {
            case models_1.SourceType.RAW_PAN:
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
            case models_1.SourceType.BASIS_THEORY_TOKEN:
            case models_1.SourceType.BASIS_THEORY_TOKEN_INTENT:
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
            case models_1.SourceType.NETWORK_TOKEN:
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
            case models_1.SourceType.PROCESSOR_TOKEN:
                payload.source.type = 'id';
                payload.source.id = source.id;
                break;
        }
    }
    async executeRequest(method, path, payload, idempotencyKey, sourceType) {
        const headers = {};
        if (idempotencyKey) {
            headers['Cko-Idempotency-Key'] = idempotencyKey;
        }
        // Check if we need to use BT proxy
        const needsProxy = sourceType === models_1.SourceType.BASIS_THEORY_TOKEN ||
            sourceType === models_1.SourceType.BASIS_THEORY_TOKEN_INTENT;
        if (needsProxy && this.config.btApiKey) {
            return this.executeBasisTheoryProxyRequest(method, path, payload, headers);
        }
        else {
            return this.executeDirectRequest(method, path, payload, headers);
        }
    }
    async executeDirectRequest(method, path, payload, additionalHeaders) {
        return this.httpClient.request({
            method,
            url: path,
            data: payload,
            headers: additionalHeaders
        });
    }
    async executeBasisTheoryProxyRequest(method, path, payload, additionalHeaders) {
        const proxyUrl = 'https://api.basistheory.com/proxy';
        const targetUrl = `${this.baseUrl}${path}`;
        return axios_1.default.request({
            method,
            url: proxyUrl,
            data: payload,
            headers: {
                'BT-API-KEY': this.config.btApiKey,
                'BT-PROXY-URL': targetUrl,
                'Authorization': `Bearer ${this.config.secretKey}`,
                'Content-Type': 'application/json',
                ...additionalHeaders
            }
        });
    }
    transformTransactionResponse(responseData) {
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
                type: models_1.SourceType.PROCESSOR_TOKEN,
                id: responseData.source.id,
                provisioned: { id: responseData.source.id }
            } : undefined,
            networkTransactionId: responseData.scheme_id,
            fullProviderResponse: responseData,
            createdAt: responseData.processed_on || new Date().toISOString()
        };
    }
    transformCaptureResponse(responseData) {
        return {
            id: responseData.action_id,
            reference: responseData.reference,
            amount: {
                value: responseData.amount || 0,
                currency: responseData.currency || 'USD'
            },
            status: {
                code: models_1.TransactionStatus.CAPTURED,
                providerCode: 'Captured'
            },
            fullProviderResponse: responseData,
            createdAt: new Date().toISOString()
        };
    }
    transformRefundResponse(responseData) {
        return {
            id: responseData.action_id,
            reference: responseData.reference || '',
            amount: {
                value: responseData.amount,
                currency: responseData.currency
            },
            status: {
                code: models_1.TransactionStatus.REFUNDED,
                providerCode: 'Refunded'
            },
            fullProviderResponse: responseData,
            createdAt: new Date().toISOString()
        };
    }
    transformCancelResponse(responseData) {
        return {
            id: responseData.action_id,
            reference: responseData.reference,
            amount: {
                value: 0,
                currency: 'USD'
            },
            status: {
                code: models_1.TransactionStatus.VOIDED,
                providerCode: 'Voided'
            },
            fullProviderResponse: responseData,
            createdAt: new Date().toISOString()
        };
    }
    mapStatus(checkoutStatus) {
        const statusMappings = {
            'Authorized': models_1.TransactionStatus.AUTHORIZED,
            'Pending': models_1.TransactionStatus.PENDING,
            'Card Verified': models_1.TransactionStatus.AUTHORIZED,
            'Declined': models_1.TransactionStatus.DECLINED,
            'Retry Scheduled': models_1.TransactionStatus.PENDING,
            'Captured': models_1.TransactionStatus.CAPTURED,
            'Partially Captured': models_1.TransactionStatus.CAPTURED,
            'Refunded': models_1.TransactionStatus.REFUNDED,
            'Partially Refunded': models_1.TransactionStatus.REFUNDED,
            'Voided': models_1.TransactionStatus.VOIDED,
            'Canceled': models_1.TransactionStatus.CANCELLED,
            'Expired': models_1.TransactionStatus.CANCELLED
        };
        return statusMappings[checkoutStatus] || models_1.TransactionStatus.DECLINED;
    }
    mapErrorCode(responseCode) {
        if (!responseCode)
            return undefined;
        const code = String(responseCode);
        const errorMappings = {
            // Card declined codes
            '20005': { category: models_1.ErrorCategory.PROCESSING_ERROR, code: models_1.ErrorCode.CARD_DECLINED },
            '20108': { category: models_1.ErrorCategory.PROCESSING_ERROR, code: models_1.ErrorCode.CARD_DECLINED },
            // Insufficient funds
            '20051': { category: models_1.ErrorCategory.PAYMENT_METHOD_ERROR, code: models_1.ErrorCode.INSUFFICIENT_FUNDS },
            '20061': { category: models_1.ErrorCategory.PAYMENT_METHOD_ERROR, code: models_1.ErrorCode.INSUFFICIENT_FUNDS },
            // Expired card
            '20054': { category: models_1.ErrorCategory.PAYMENT_METHOD_ERROR, code: models_1.ErrorCode.EXPIRED_CARD },
            '30033': { category: models_1.ErrorCategory.PAYMENT_METHOD_ERROR, code: models_1.ErrorCode.EXPIRED_CARD },
            // Invalid card
            '20014': { category: models_1.ErrorCategory.PAYMENT_METHOD_ERROR, code: models_1.ErrorCode.INVALID_CARD },
            '20039': { category: models_1.ErrorCategory.PAYMENT_METHOD_ERROR, code: models_1.ErrorCode.INVALID_CARD },
            // CVC declined
            '20082': { category: models_1.ErrorCategory.PAYMENT_METHOD_ERROR, code: models_1.ErrorCode.CVC_DECLINED },
            '20124': { category: models_1.ErrorCategory.PAYMENT_METHOD_ERROR, code: models_1.ErrorCode.CVC_DECLINED },
            // Blocked card
            '20004': { category: models_1.ErrorCategory.PAYMENT_METHOD_ERROR, code: models_1.ErrorCode.BLOCKED_CARD },
            '20067': { category: models_1.ErrorCategory.PAYMENT_METHOD_ERROR, code: models_1.ErrorCode.BLOCKED_CARD },
            // Fraud detected
            '20059': { category: models_1.ErrorCategory.FRAUD_DECLINE, code: models_1.ErrorCode.FRAUD_DETECTED },
            '20063': { category: models_1.ErrorCategory.FRAUD_DECLINE, code: models_1.ErrorCode.FRAUD_DETECTED },
            // 3DS failed
            '20150': { category: models_1.ErrorCategory.AUTHENTICATION_ERROR, code: models_1.ErrorCode.THREE_DS_FAILED },
            '20151': { category: models_1.ErrorCategory.AUTHENTICATION_ERROR, code: models_1.ErrorCode.THREE_DS_FAILED },
            // Issuer unavailable
            '20091': { category: models_1.ErrorCategory.PROCESSING_ERROR, code: models_1.ErrorCode.ISSUER_UNAVAILABLE }
        };
        return errorMappings[code] || {
            category: models_1.ErrorCategory.UNKNOWN,
            code: models_1.ErrorCode.UNKNOWN
        };
    }
    handleError(error) {
        let errorResponse;
        if (error.response) {
            // HTTP error response
            const responseData = error.response.data;
            const httpStatus = error.response.status;
            const errorCodes = [];
            const providerErrors = [];
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
                const httpErrorMapping = {
                    401: { category: models_1.ErrorCategory.AUTHENTICATION_ERROR, code: models_1.ErrorCode.AUTHENTICATION_ERROR },
                    403: { category: models_1.ErrorCategory.AUTHENTICATION_ERROR, code: models_1.ErrorCode.AUTHENTICATION_ERROR },
                    404: { category: models_1.ErrorCategory.PROCESSING_ERROR, code: models_1.ErrorCode.PSP_ERROR },
                    422: { category: models_1.ErrorCategory.VALIDATION_ERROR, code: models_1.ErrorCode.VALIDATION_ERROR },
                    429: { category: models_1.ErrorCategory.PROCESSING_ERROR, code: models_1.ErrorCode.RATE_LIMIT },
                    500: { category: models_1.ErrorCategory.PROCESSING_ERROR, code: models_1.ErrorCode.PSP_ERROR }
                };
                const mappedError = httpErrorMapping[httpStatus];
                if (mappedError) {
                    errorCodes.push(mappedError);
                }
                else {
                    errorCodes.push({ category: models_1.ErrorCategory.UNKNOWN, code: models_1.ErrorCode.UNKNOWN });
                }
            }
            errorResponse = {
                errorCodes,
                providerErrors,
                fullProviderResponse: responseData
            };
        }
        else {
            // Network or other error
            errorResponse = {
                errorCodes: [{ category: models_1.ErrorCategory.PROCESSING_ERROR, code: models_1.ErrorCode.PSP_ERROR }],
                providerErrors: [error.message || 'Network error occurred'],
                fullProviderResponse: null
            };
        }
        return new models_1.TransactionError(errorResponse);
    }
}
exports.CheckoutProvider = CheckoutProvider;
