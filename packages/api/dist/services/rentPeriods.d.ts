import type { RentPeriod, Tenant, Lease, ApiResponse } from '../types';
export declare class RentPeriodsService {
    /**
     * Create rent periods for a tenant based on their lease
     */
    static createRentPeriods(tenant: Tenant, lease: Lease): Promise<ApiResponse<RentPeriod[]>>;
    /**
     * Get all rent periods for a tenant
     */
    static getTenantRentPeriods(tenantId: string): Promise<ApiResponse<RentPeriod[]>>;
    /**
     * Update a rent period (for overrides)
     */
    static updateRentPeriod(periodId: string, updates: Partial<RentPeriod>): Promise<ApiResponse<RentPeriod>>;
    /**
     * Calculate total owed for a tenant based on rent periods
     */
    static calculateTenantOwedAmount(tenantId: string): Promise<ApiResponse<{
        totalOwed: number;
        totalLateFees: number;
        missedPeriods: number;
        periods: RentPeriod[];
    }>>;
    /**
     * Allocate a payment to specific rent periods
     */
    static allocatePayment(paymentId: string, allocations: Array<{
        rent_period_id: string;
        amount: number;
    }>): Promise<ApiResponse<boolean>>;
}
