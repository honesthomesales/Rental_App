import type { Database } from '../database.types';
type RentPeriodRow = Database['public']['Tables']['RENT_rent_periods']['Row'];
interface RentPeriodGenerationResult {
    success: boolean;
    periods_created: number;
    periods_updated: number;
    errors: string[];
}
export declare class RentPeriodsService {
    /**
     * Generate rent periods for a lease from start date to end date
     */
    static generateRentPeriods(leaseId: string, tenantId: string, propertyId: string, startDate: string, endDate: string, rentAmount: number, rentCadence: string, rentDueDay?: number): Promise<RentPeriodGenerationResult>;
    /**
     * Update existing rent periods for a lease
     */
    private static updateExistingRentPeriods;
    /**
     * Calculate rent period dates based on cadence and due day
     */
    private static calculateRentPeriods;
    /**
     * Get all rent periods for a tenant
     */
    static getTenantRentPeriods(tenantId: string): Promise<ApiResponse<RentPeriodRow[]>>;
    /**
     * Get rent periods for a specific property
     */
    static getPropertyRentPeriods(propertyId: string): Promise<ApiResponse<RentPeriodRow[]>>;
    /**
     * Get overdue rent periods for a tenant
     */
    static getOverdueRentPeriods(tenantId: string): Promise<ApiResponse<RentPeriodRow[]>>;
    /**
     * Update rent period status
     */
    static updateRentPeriodStatus(periodId: string, status: string, amountPaid?: number, lateFeeApplied?: number, lateFeeWaived?: boolean): Promise<ApiResponse<RentPeriodRow>>;
    /**
     * Delete rent periods for a lease (when lease is terminated)
     */
    static deleteLeaseRentPeriods(leaseId: string): Promise<ApiResponse<boolean>>;
    /**
     * Get rent period summary for a tenant
     */
    static getTenantRentPeriodSummary(tenantId: string): Promise<ApiResponse<{
        total_periods: number;
        paid_periods: number;
        unpaid_periods: number;
        partial_periods: number;
        overdue_periods: number;
        total_owed: number;
        total_paid: number;
        total_late_fees: number;
    }>>;
}
export {};
