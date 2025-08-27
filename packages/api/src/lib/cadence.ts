/**
 * Cadence helper functions for rent period calculations
 */

/**
 * Add cadence days to a date
 */
export function addCadenceDays(date: string, cadence: string): string {
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
export function getLateFeeAmount(cadence: string): number {
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
export function isPeriodLate(dueDate: string, graceDays: number = 5): boolean {
  const due = new Date(dueDate);
  const graceEnd = new Date(due);
  graceEnd.setDate(graceEnd.getDate() + graceDays);
  const today = new Date();
  
  return today > graceEnd;
}

/**
 * Calculate days late for a period
 */
export function calculateDaysLate(dueDate: string, graceDays: number = 5): number {
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
export function getNextDueDate(currentDueDate: string, cadence: string): string {
  return addCadenceDays(currentDueDate, cadence);
}

/**
 * Generate future due dates for a given period
 */
export function generateFutureDueDates(
  startDate: string, 
  cadence: string, 
  count: number
): string[] {
  const dates: string[] = [];
  let currentDate = startDate;
  
  for (let i = 0; i < count; i++) {
    dates.push(currentDate);
    currentDate = addCadenceDays(currentDate, cadence);
  }
  
  return dates;
}
