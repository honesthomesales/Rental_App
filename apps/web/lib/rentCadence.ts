/**
 * Standardized rent cadence values used throughout the application
 */
export const RENT_CADENCE_OPTIONS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'bi-weekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' }
] as const;

export type RentCadence = typeof RENT_CADENCE_OPTIONS[number]['value'];

/**
 * Normalize rent cadence value to handle various formats
 * This handles legacy data that might have different formats
 */
export function normalizeRentCadence(cadence: string | null | undefined): RentCadence {
  if (!cadence) return 'monthly';
  
  const normalized = cadence.toLowerCase().trim();
  
  // Handle various bi-weekly formats
  if (normalized === 'bi-weekly' || normalized === 'biweekly' || normalized === 'bi_weekly' || normalized === 'bi weekly') {
    return 'bi-weekly';
  }
  
  if (normalized === 'weekly') {
    return 'weekly';
  }
  
  if (normalized === 'monthly') {
    return 'monthly';
  }
  
  // Default to monthly for unknown values
  return 'monthly';
}

/**
 * Get display label for rent cadence value
 */
export function getRentCadenceLabel(cadence: RentCadence): string {
  return RENT_CADENCE_OPTIONS.find(option => option.value === cadence)?.label || 'Monthly';
}

/**
 * Get priority number for sorting (Weekly = 1, Bi-weekly = 2, Monthly = 3)
 */
export function getRentCadencePriority(cadence: RentCadence): number {
  switch (cadence) {
    case 'weekly': return 1;
    case 'bi-weekly': return 2;
    case 'monthly': return 3;
    default: return 3;
  }
}
