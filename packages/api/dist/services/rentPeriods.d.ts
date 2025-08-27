import type { ApiResponse } from '../types';
export interface RentPeriod {
    id: string;
    tenant_id: string;
    property_id: string;
    lease_id: string;
    period_due_date: string;
    rent_amount: number;
    rent_cadence: string;
    status: 'paid' | 'unpaid' | 'partial';
    amount_paid: number;
    late_fee_applied: number;
    late_fee_waived: boolean;
    due_date_override: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}
export interface UpdateRentPeriodData {
    late_fee_applied?: number;
    late_fee_waived?: boolean;
    amount_paid?: number;
    status?: 'paid' | 'unpaid' | 'partial';
}
export declare class RentPeriodsService {
    private static getSupabaseClientSafe;
    /**
     * Get rent periods for a specific tenant
     */
    static getTenantRentPeriods(tenantId: string): Promise<ApiResponse<RentPeriod[]>>;
    /**
     * Get rent periods for a specific property
     */
    static getPropertyRentPeriods(propertyId: string): Promise<ApiResponse<RentPeriod[]>>;
    /**
     * Get all rent periods with late fees
     */
    static getLateRentPeriods(): Promise<ApiResponse<RentPeriod[]>>;
    /**
     * Update a rent period
     */
    static update(id: string, updateData: UpdateRentPeriodData): Promise<ApiResponse<RentPeriod>>;
    /**
     * Bulk update multiple rent periods
     */
    static bulkUpdate(periodIds: string[], updateData: UpdateRentPeriodData): Promise<ApiResponse<RentPeriod[]>>;
    /**
     * Waive late fees for multiple periods (set late_fee_waived to true)
     */
    static waiveLateFees(periodIds: string[]): Promise<ApiResponse<RentPeriod[]>>;
    /**
     * Create a new rent period
     */
    static create(periodData: Omit<RentPeriod, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<RentPeriod>>;
    /**
     * Delete a rent period
     */
    static delete(id: string): Promise<ApiResponse<boolean>>;
}
