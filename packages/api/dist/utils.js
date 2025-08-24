"use strict";
// Utility functions for the API
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractRentCadence = extractRentCadence;
exports.normalizeRentToMonthly = normalizeRentToMonthly;
function extractRentCadence(cadence) {
    return cadence.toLowerCase().trim();
}
function normalizeRentToMonthly(amount, cadence) {
    var normalizedCadence = extractRentCadence(cadence);
    switch (normalizedCadence) {
        case 'weekly':
            return amount * 4.33; // Average weeks per month
        case 'bi-weekly':
        case 'biweekly':
        case 'bi_weekly':
            return amount * 2.17; // Average bi-weekly periods per month
        case 'monthly':
        default:
            return amount;
    }
}
//# sourceMappingURL=utils.js.map