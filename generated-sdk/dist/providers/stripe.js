"use strict";
/**
 * Stripe Provider Implementation
 * Generated from stripe.json mapping
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeProvider = void 0;
const axios_1 = __importDefault(require("axios"));
const models_1 = require("../models");
const client_1 = require("../client");
class StripeProvider {
    constructor(config) {
        this.name = 'stripe';
        this.config = config;
        this.baseUrl = 'https://api.stripe.com';
        this.httpClient = axios_1.default.create({
            baseURL: this.baseUrl,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer ${config.secretKey}`,
                ...(config.apiVersion && { 'Stripe-Version': config.apiVersion })
            }
        });
    }
    async authorize(request, idempotencyKey) {
        const operation = {
            method: 'POST',
            path: '/v1/payment_intents'
        };
        // Build request payload
        let payload = {
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
            (0, client_1.setField)(payload, 'metadata.reference', request.reference);
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
            (0, client_1.setField)(payload, 'payment_method_options.card.mit_exemption.network_transaction_id', request.previousNetworkTransactionId);
        }
        // Apply 3DS fields
        if (request.threeDs) {
            if (request.threeDs.authenticationValue) {
                (0, client_1.setField)(payload, 'payment_method_options.card.three_d_secure.cryptogram', request.threeDs.authenticationValue);
            }
            if (request.threeDs.eci) {
                (0, client_1.setField)(payload, 'payment_method_options.card.three_d_secure.electronic_commerce_indicator', request.threeDs.eci);
            }
            if (request.threeDs.dsTransactionId) {
                (0, client_1.setField)(payload, 'payment_method_options.card.three_d_secure.transaction_id', request.threeDs.dsTransactionId);
            }
            if (request.threeDs.version) {
                (0, client_1.setField)(payload, 'payment_method_options.card.three_d_secure.version', request.threeDs.version);
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
            path: '/v1/payment_intents/{transaction_id}/capture'
        };
        let payload = {
            amount_to_capture: amount.value
        };
        if (reference) {
            (0, client_1.setField)(payload, 'metadata.reference', reference);
        }
        try {
            const path = (0, client_1.interpolatePath)(operation.path, { transaction_id: transactionId });
            const response = await this.executeRequest(operation.method, path, payload);
            return this.transformTransactionResponse(response.data);
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
    async get(transactionId) {
        const operation = {
            method: 'GET',
            path: '/v1/payment_intents/{transaction_id}'
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
            path: '/v1/refunds'
        };
        let payload = {
            payment_intent: request.originalTransactionId,
            amount: request.amount.value
        };
        if (request.reason) {
            payload.reason = request.reason;
        }
        try {
            const response = await this.executeRequest(operation.method, operation.path, payload, idempotencyKey);
            return this.transformRefundResponse(response.data);
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
    async cancel(transactionId, reference) {
        const operation = {
            method: 'POST',
            path: '/v1/payment_intents/{transaction_id}/cancel'
        };
        let payload = {};
        if (reference) {
            payload.cancellation_reason = reference;
        }
        try {
            const path = (0, client_1.interpolatePath)(operation.path, { transaction_id: transactionId });
            const response = await this.executeRequest(operation.method, path, payload);
            return this.transformTransactionResponse(response.data);
        }
        catch (error) {
            throw this.handleError(error);
        }
    }
    applySourceTransform(payload, source) {
        switch (source.type) {
            case models_1.SourceType.RAW_PAN:
                (0, client_1.setField)(payload, 'payment_method_data.type', 'card');
                (0, client_1.setField)(payload, 'payment_method_data.card.number', source.number);
                (0, client_1.setField)(payload, 'payment_method_data.card.exp_month', source.expiryMonth);
                (0, client_1.setField)(payload, 'payment_method_data.card.exp_year', source.expiryYear);
                (0, client_1.setField)(payload, 'payment_method_data.card.cvc', source.cvc);
                break;
            case models_1.SourceType.BASIS_THEORY_TOKEN:
            case models_1.SourceType.BASIS_THEORY_TOKEN_INTENT:
                // For BT tokens, the transform expressions are handled by the proxy
                (0, client_1.setField)(payload, 'payment_method_data.type', 'card');
                (0, client_1.setField)(payload, 'payment_method_data.card.number', `{{ token: ${source.id} | json: '$.data.number' }}`);
                (0, client_1.setField)(payload, 'payment_method_data.card.exp_month', `{{ token: ${source.id} | json: '$.data.expiration_month' }}`);
                (0, client_1.setField)(payload, 'payment_method_data.card.exp_year', `{{ token: ${source.id} | json: '$.data.expiration_year' }}`);
                (0, client_1.setField)(payload, 'payment_method_data.card.cvc', `{{ token: ${source.id} | json: '$.data.cvc' }}`);
                break;
            case models_1.SourceType.NETWORK_TOKEN:
                (0, client_1.setField)(payload, 'payment_method_data.type', 'card');
                (0, client_1.setField)(payload, 'payment_method_data.card.number', source.number);
                (0, client_1.setField)(payload, 'payment_method_data.card.exp_month', source.expiryMonth);
                (0, client_1.setField)(payload, 'payment_method_data.card.exp_year', source.expiryYear);
                if (source.cryptogram) {
                    (0, client_1.setField)(payload, 'payment_method_options.card.three_d_secure.cryptogram', source.cryptogram);
                }
                if (source.eci) {
                    (0, client_1.setField)(payload, 'payment_method_options.card.three_d_secure.electronic_commerce_indicator', source.eci);
                }
                break;
            case models_1.SourceType.PROCESSOR_TOKEN:
                payload.payment_method = source.id;
                break;
        }
        if (source.holderName && source.type !== models_1.SourceType.PROCESSOR_TOKEN) {
            (0, client_1.setField)(payload, 'payment_method_data.billing_details.name', source.holderName);
        }
    }
    async executeRequest(method, path, payload, idempotencyKey, sourceType) {
        const headers = {};
        if (idempotencyKey) {
            headers['Idempotency-Key'] = idempotencyKey;
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
        const url = `${this.baseUrl}${path}`;
        // Flatten payload for form encoding
        const formData = (0, client_1.flattenObject)(payload);
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
    async executeBasisTheoryProxyRequest(method, path, payload, additionalHeaders) {
        const proxyUrl = 'https://api.basistheory.com/proxy';
        const targetUrl = `${this.baseUrl}${path}`;
        // Flatten payload for form encoding
        const formData = (0, client_1.flattenObject)(payload);
        const body = new URLSearchParams(formData).toString();
        return axios_1.default.request({
            method,
            url: proxyUrl,
            data: body,
            headers: {
                'BT-API-KEY': this.config.btApiKey,
                'BT-PROXY-URL': targetUrl,
                'Authorization': `Bearer ${this.config.secretKey}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                ...(this.config.apiVersion && { 'Stripe-Version': this.config.apiVersion }),
                ...additionalHeaders
            }
        });
    }
    transformTransactionResponse(responseData) {
        const status = this.mapStatus(responseData.status);
        const responseCode = this.mapErrorCode((0, client_1.getField)(responseData, 'last_payment_error.decline_code'));
        return {
            id: responseData.id,
            reference: (0, client_1.getField)(responseData, 'metadata.reference'),
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
                type: models_1.SourceType.PROCESSOR_TOKEN,
                id: responseData.payment_method,
                provisioned: { id: responseData.payment_method }
            } : undefined,
            networkTransactionId: (0, client_1.getField)(responseData, 'charges.data[0].network_transaction_id'),
            fullProviderResponse: responseData,
            createdAt: new Date(responseData.created * 1000).toISOString()
        };
    }
    transformRefundResponse(responseData) {
        return {
            id: responseData.id,
            reference: (0, client_1.getField)(responseData, 'metadata.reference') || '',
            amount: {
                value: responseData.amount,
                currency: responseData.currency
            },
            status: {
                code: models_1.TransactionStatus.REFUNDED,
                providerCode: responseData.status
            },
            refundedTransactionId: responseData.payment_intent,
            fullProviderResponse: responseData,
            createdAt: new Date(responseData.created * 1000).toISOString()
        };
    }
    mapStatus(stripeStatus) {
        const statusMappings = {
            'requires_capture': models_1.TransactionStatus.AUTHORIZED,
            'succeeded': models_1.TransactionStatus.CAPTURED,
            'requires_action': models_1.TransactionStatus.ACTION_REQUIRED,
            'requires_confirmation': models_1.TransactionStatus.PENDING,
            'processing': models_1.TransactionStatus.PENDING,
            'canceled': models_1.TransactionStatus.CANCELLED,
            'requires_payment_method': models_1.TransactionStatus.DECLINED
        };
        return statusMappings[stripeStatus] || models_1.TransactionStatus.DECLINED;
    }
    mapErrorCode(declineCode) {
        if (!declineCode)
            return undefined;
        const errorMappings = {
            // Card declined codes
            'generic_decline': { category: models_1.ErrorCategory.PROCESSING_ERROR, code: models_1.ErrorCode.CARD_DECLINED },
            'do_not_honor': { category: models_1.ErrorCategory.PROCESSING_ERROR, code: models_1.ErrorCode.CARD_DECLINED },
            'insufficient_funds': { category: models_1.ErrorCategory.PAYMENT_METHOD_ERROR, code: models_1.ErrorCode.INSUFFICIENT_FUNDS },
            'expired_card': { category: models_1.ErrorCategory.PAYMENT_METHOD_ERROR, code: models_1.ErrorCode.EXPIRED_CARD },
            'incorrect_cvc': { category: models_1.ErrorCategory.PAYMENT_METHOD_ERROR, code: models_1.ErrorCode.CVC_DECLINED },
            'incorrect_number': { category: models_1.ErrorCategory.PAYMENT_METHOD_ERROR, code: models_1.ErrorCode.INVALID_CARD },
            'fraudulent': { category: models_1.ErrorCategory.FRAUD_DECLINE, code: models_1.ErrorCode.FRAUD_DETECTED },
            'lost_card': { category: models_1.ErrorCategory.PAYMENT_METHOD_ERROR, code: models_1.ErrorCode.BLOCKED_CARD },
            'stolen_card': { category: models_1.ErrorCategory.PAYMENT_METHOD_ERROR, code: models_1.ErrorCode.BLOCKED_CARD },
            'authentication_required': { category: models_1.ErrorCategory.AUTHENTICATION_ERROR, code: models_1.ErrorCode.THREE_DS_FAILED }
        };
        return errorMappings[declineCode] || {
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
                const httpErrorMapping = {
                    401: { category: models_1.ErrorCategory.AUTHENTICATION_ERROR, code: models_1.ErrorCode.AUTHENTICATION_ERROR },
                    403: { category: models_1.ErrorCategory.AUTHENTICATION_ERROR, code: models_1.ErrorCode.AUTHENTICATION_ERROR },
                    400: { category: models_1.ErrorCategory.VALIDATION_ERROR, code: models_1.ErrorCode.VALIDATION_ERROR },
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
exports.StripeProvider = StripeProvider;
