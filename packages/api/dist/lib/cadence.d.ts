/**
 * Cadence helper functions for rent period calculations
 */
/**
 * Add cadence days to a date
 */
export declare function addCadenceDays(date: string, cadence: string): string;
/**
 * Get late fee amount based on cadence
 */
export declare function getLateFeeAmount(cadence: string): number;
/**
 * Check if a period is late (beyond grace period)
 */
export declare function isPeriodLate(dueDate: string, graceDays?: number): boolean;
/**
 * Calculate days late for a period
 */
export declare function calculateDaysLate(dueDate: string, graceDays?: number): number;
/**
 * Get next due date based on cadence
 */
export declare function getNextDueDate(currentDueDate: string, cadence: string): string;
/**
 * Generate future due dates for a given period
 */
export declare function generateFutureDueDates(startDate: string, cadence: string, count: number): string[];
