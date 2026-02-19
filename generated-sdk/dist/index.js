"use strict";
/**
 * Unified Payment SDK - Entry Point
 * Generated TypeScript SDK for multiple payment service providers
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SDK_NAME = exports.SDK_VERSION = exports.PaymentClient = exports.TransactionError = exports.RecurringType = exports.ErrorCode = exports.ErrorCategory = exports.TransactionStatus = exports.SourceType = exports.CheckoutProvider = exports.StripeProvider = void 0;
exports.createPaymentClient = createPaymentClient;
// Export all types and models
__exportStar(require("./models"), exports);
// Export client and provider interface
__exportStar(require("./client"), exports);
// Export provider implementations
var stripe_1 = require("./providers/stripe");
Object.defineProperty(exports, "StripeProvider", { enumerable: true, get: function () { return stripe_1.StripeProvider; } });
var checkout_1 = require("./providers/checkout");
Object.defineProperty(exports, "CheckoutProvider", { enumerable: true, get: function () { return checkout_1.CheckoutProvider; } });
const client_1 = require("./client");
const stripe_2 = require("./providers/stripe");
const checkout_2 = require("./providers/checkout");
var models_1 = require("./models");
Object.defineProperty(exports, "SourceType", { enumerable: true, get: function () { return models_1.SourceType; } });
Object.defineProperty(exports, "TransactionStatus", { enumerable: true, get: function () { return models_1.TransactionStatus; } });
Object.defineProperty(exports, "ErrorCategory", { enumerable: true, get: function () { return models_1.ErrorCategory; } });
Object.defineProperty(exports, "ErrorCode", { enumerable: true, get: function () { return models_1.ErrorCode; } });
Object.defineProperty(exports, "RecurringType", { enumerable: true, get: function () { return models_1.RecurringType; } });
Object.defineProperty(exports, "TransactionError", { enumerable: true, get: function () { return models_1.TransactionError; } });
var client_2 = require("./client");
Object.defineProperty(exports, "PaymentClient", { enumerable: true, get: function () { return client_2.PaymentClient; } });
// Helper function to create a payment client with common providers
function createPaymentClient(config) {
    const providers = [];
    if (config.stripe) {
        providers.push(new stripe_2.StripeProvider(config.stripe));
    }
    if (config.checkout) {
        providers.push(new checkout_2.CheckoutProvider(config.checkout));
    }
    return new client_1.PaymentClient(providers);
}
// Version information
exports.SDK_VERSION = '1.0.0';
exports.SDK_NAME = 'unified-payment-sdk';
