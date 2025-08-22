// Utility functions for the API

export function extractRentCadence(cadence: string): string {
  return cadence.toLowerCase().trim();
}

export function normalizeRentToMonthly(amount: number, cadence: string): number {
  const normalizedCadence = extractRentCadence(cadence);
  
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
