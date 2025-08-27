"use strict";
/**
 * Cadence helper functions for rent period calculations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.addCadenceDays = addCadenceDays;
exports.getLateFeeAmount = getLateFeeAmount;
exports.isPeriodLate = isPeriodLate;
exports.calculateDaysLate = calculateDaysLate;
exports.getNextDueDate = getNextDueDate;
exports.generateFutureDueDates = generateFutureDueDates;
/**
 * Add cadence days to a date
 */
function addCadenceDays(date, cadence) {
    const baseDate = new Date(date);
    switch (cadence.toLowerCase()) {
        case 'weekly':
            baseDate.setDate(baseDate.getDate() + 7);
            break;
        case 'biweekly':
        case 'bi-weekly':
        case 'biweekly':
            baseDate.setDate(baseDate.getDate() + 14);
            break;
        case 'monthly':
            baseDate.setMonth(baseDate.getMonth() + 1);
            break;
        default:
            throw new Error(`Unsupported cadence: ${cadence}`);
    }
    return baseDate.toISOString().split('T')[0];
}
/**
 * Get late fee amount based on cadence
 */
function getLateFeeAmount(cadence) {
    switch (cadence.toLowerCase()) {
        case 'weekly':
            return 10;
        case 'biweekly':
        case 'bi-weekly':
        case 'biweekly':
            return 20;
        case 'monthly':
            return 45;
        default:
            return 45; // Default to monthly
    }
}
/**
 * Check if a period is late (beyond grace period)
 */
function isPeriodLate(dueDate, graceDays = 5) {
    const due = new Date(dueDate);
    const graceEnd = new Date(due);
    graceEnd.setDate(graceEnd.getDate() + graceDays);
    const today = new Date();
    return today > graceEnd;
}
/**
 * Calculate days late for a period
 */
function calculateDaysLate(dueDate, graceDays = 5) {
    const due = new Date(dueDate);
    const graceEnd = new Date(due);
    graceEnd.setDate(graceEnd.getDate() + graceDays);
    const today = new Date();
    if (today <= graceEnd) {
        return 0;
    }
    return Math.floor((today.getTime() - graceEnd.getTime()) / (1000 * 60 * 60 * 24));
}
/**
 * Get next due date based on cadence
 */
function getNextDueDate(currentDueDate, cadence) {
    return addCadenceDays(currentDueDate, cadence);
}
/**
 * Generate future due dates for a given period
 */
function generateFutureDueDates(startDate, cadence, count) {
    const dates = [];
    let currentDate = startDate;
    for (let i = 0; i < count; i++) {
        dates.push(currentDate);
        currentDate = addCadenceDays(currentDate, cadence);
    }
    return dates;
}
