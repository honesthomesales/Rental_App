"use strict";
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
exports.getCollectionsSummary = exports.getCollectedTotal = exports.allocatePayment = exports.OtherService = exports.RentPeriodsService = exports.PaymentsService = exports.TransactionsService = exports.LeasesService = exports.TenantsService = exports.PropertiesService = exports.createApiResponseRN = exports.handleSupabaseErrorRN = exports.supabaseRN = exports.createApiResponse = exports.handleSupabaseError = exports.supabase = void 0;
// Export types
__exportStar(require("./types"), exports);
__exportStar(require("./database.types"), exports);
__exportStar(require("./types/ui"), exports);
// Export client
var client_1 = require("./client");
Object.defineProperty(exports, "supabase", { enumerable: true, get: function () { return client_1.supabase; } });
Object.defineProperty(exports, "handleSupabaseError", { enumerable: true, get: function () { return client_1.handleSupabaseError; } });
Object.defineProperty(exports, "createApiResponse", { enumerable: true, get: function () { return client_1.createApiResponse; } });
var client_rn_1 = require("./client-rn");
Object.defineProperty(exports, "supabaseRN", { enumerable: true, get: function () { return client_rn_1.supabase; } });
Object.defineProperty(exports, "handleSupabaseErrorRN", { enumerable: true, get: function () { return client_rn_1.handleSupabaseError; } });
Object.defineProperty(exports, "createApiResponseRN", { enumerable: true, get: function () { return client_rn_1.createApiResponse; } });
// Export services
var properties_1 = require("./services/properties");
Object.defineProperty(exports, "PropertiesService", { enumerable: true, get: function () { return properties_1.PropertiesService; } });
var tenants_1 = require("./services/tenants");
Object.defineProperty(exports, "TenantsService", { enumerable: true, get: function () { return tenants_1.TenantsService; } });
var leases_1 = require("./services/leases");
Object.defineProperty(exports, "LeasesService", { enumerable: true, get: function () { return leases_1.LeasesService; } });
var transactions_1 = require("./services/transactions");
Object.defineProperty(exports, "TransactionsService", { enumerable: true, get: function () { return transactions_1.TransactionsService; } });
var payments_1 = require("./services/payments");
Object.defineProperty(exports, "PaymentsService", { enumerable: true, get: function () { return payments_1.PaymentsService; } });
var rentPeriods_1 = require("./services/rentPeriods");
Object.defineProperty(exports, "RentPeriodsService", { enumerable: true, get: function () { return rentPeriods_1.RentPeriodsService; } });
var other_1 = require("./services/other");
Object.defineProperty(exports, "OtherService", { enumerable: true, get: function () { return other_1.OtherService; } });
// Export payment allocation and collections
var allocatePayment_1 = require("./lib/allocatePayment");
Object.defineProperty(exports, "allocatePayment", { enumerable: true, get: function () { return allocatePayment_1.allocatePayment; } });
var collections_1 = require("./lib/collections");
Object.defineProperty(exports, "getCollectedTotal", { enumerable: true, get: function () { return collections_1.getCollectedTotal; } });
Object.defineProperty(exports, "getCollectionsSummary", { enumerable: true, get: function () { return collections_1.getCollectionsSummary; } });
__exportStar(require("./lib/cadence"), exports);
