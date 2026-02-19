"use strict";
/**
 * Unified Payment SDK - Client and Provider Interface
 * Generated from provider interface and client pattern specifications
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentClient = void 0;
exports.buildAuthHeaders = buildAuthHeaders;
exports.flattenObject = flattenObject;
exports.interpolatePath = interpolatePath;
exports.getField = getField;
exports.setField = setField;
// ============================================================================
// Client Wrapper
// ============================================================================
class PaymentClient {
    constructor(providers) {
        this.providers = new Map();
        for (const provider of providers) {
            this.providers.set(provider.name, provider);
        }
    }
    /**
     * Get available provider names
     */
    getProviderNames() {
        return Array.from(this.providers.keys());
    }
    /**
     * Get a provider by name
     */
    getProvider(name) {
        return this.providers.get(name);
    }
    /**
     * Create and authorize a payment with the specified provider
     */
    async authorize(providerName, request, idempotencyKey) {
        const provider = this.providers.get(providerName);
        if (!provider) {
            throw new Error(`Provider '${providerName}' not found. Available providers: ${this.getProviderNames().join(', ')}`);
        }
        return provider.authorize(request, idempotencyKey);
    }
    /**
     * Capture a previously authorized payment
     */
    async capture(providerName, transactionId, amount, reference) {
        const provider = this.providers.get(providerName);
        if (!provider) {
            throw new Error(`Provider '${providerName}' not found. Available providers: ${this.getProviderNames().join(', ')}`);
        }
        return provider.capture(transactionId, amount, reference);
    }
    /**
     * Retrieve payment details
     */
    async get(providerName, transactionId) {
        const provider = this.providers.get(providerName);
        if (!provider) {
            throw new Error(`Provider '${providerName}' not found. Available providers: ${this.getProviderNames().join(', ')}`);
        }
        return provider.get(transactionId);
    }
    /**
     * Refund a captured payment
     */
    async refund(providerName, request, idempotencyKey) {
        const provider = this.providers.get(providerName);
        if (!provider) {
            throw new Error(`Provider '${providerName}' not found. Available providers: ${this.getProviderNames().join(', ')}`);
        }
        return provider.refund(request, idempotencyKey);
    }
    /**
     * Cancel / void a payment before capture
     */
    async cancel(providerName, transactionId, reference) {
        const provider = this.providers.get(providerName);
        if (!provider) {
            throw new Error(`Provider '${providerName}' not found. Available providers: ${this.getProviderNames().join(', ')}`);
        }
        return provider.cancel(transactionId, reference);
    }
}
exports.PaymentClient = PaymentClient;
/**
 * Helper to build authentication headers
 */
function buildAuthHeaders(_authType, headerName, headerPrefix, credential, additionalHeaders = {}) {
    const headers = { ...additionalHeaders };
    if (headerPrefix) {
        headers[headerName] = `${headerPrefix} ${credential}`;
    }
    else {
        headers[headerName] = credential;
    }
    return headers;
}
/**
 * Helper to flatten objects for form-encoded requests (Stripe)
 */
function flattenObject(obj, prefix = '', result = {}) {
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
                    }
                    else {
                        result[`${newKey}[${index}]`] = String(item);
                    }
                });
            }
            else if (typeof value === 'object' && value !== null) {
                flattenObject(value, newKey, result);
            }
            else {
                result[newKey] = String(value);
            }
        }
    }
    return result;
}
/**
 * Helper to interpolate path parameters
 */
function interpolatePath(path, params) {
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
function getField(obj, path) {
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
function setField(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
        if (current[key] === undefined) {
            current[key] = {};
        }
        return current[key];
    }, obj);
    target[lastKey] = value;
}
