/**
 * Shared model definitions for rent management
 * This file serves as the source of truth for rent cadence and lease status values
 */

export const RENT_CADENCE = ['weekly', 'biweekly', 'monthly'] as const;
export const LEASE_STATUS = ['active', 'ended', 'terminated'] as const;

export type RentCadence = typeof RENT_CADENCE[number];
export type LeaseStatus = typeof LEASE_STATUS[number];

/**
 * Get display label for rent cadence
 */
export function getRentCadenceLabel(cadence: RentCadence): string {
  switch (cadence) {
    case 'weekly':
      return 'Weekly';
    case 'biweekly':
      return 'Biweekly';
    case 'monthly':
      return 'Monthly';
    default:
      return 'Monthly';
  }
}

/**
 * Get display label for lease status
 */
export function getLeaseStatusLabel(status: LeaseStatus): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'ended':
      return 'Ended';
    case 'terminated':
      return 'Terminated';
    default:
      return 'Active';
  }
}

/**
 * Map legacy status values to new standardized values
 */
export function normalizeLeaseStatus(status: string): LeaseStatus {
  const normalized = status.toLowerCase().trim();
  
  if (normalized === 'expired' || normalized === 'retired') {
    return 'ended';
  }
  
  if (normalized === 'terminated') {
    return 'terminated';
  }
  
  return 'active';
}

/**
 * Check if rent due day is required for a given cadence
 */
export function isRentDueDayRequired(cadence: RentCadence): boolean {
  return cadence === 'monthly';
}

/**
 * Get default late fee amount based on cadence
 */
export function getDefaultLateFee(cadence: RentCadence): number {
  switch (cadence) {
    case 'weekly':
      return 10;
    case 'biweekly':
      return 20;
    case 'monthly':
      return 45;
    default:
      return 45;
  }
}
