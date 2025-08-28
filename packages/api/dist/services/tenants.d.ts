import type { Database } from '../database.types';
import type { Tenant as TenantType } from '../types';
type TenantInsert = Database['public']['Tables']['RENT_tenants']['Insert'];
type TenantUpdate = Database['public']['Tables']['RENT_tenants']['Update'];
interface ApiResponse<T> {
    data: T | null;
    error: string | null;
    success: boolean;
}
export declare class TenantsService {
    /**
     * Get all tenants with optional filtering
     */
    static getAll(filters?: {
        property_id?: string;
        is_active?: boolean;
        late_status?: string;
    }): Promise<ApiResponse<TenantType[]>>;
    /**
     * Get a tenant by ID
     */
    static getById(id: string): Promise<ApiResponse<TenantType>>;
    /**
     * Create a new tenant
     */
    static create(tenantData: TenantInsert): Promise<ApiResponse<TenantType>>;
    /**
     * Update an existing tenant
     */
    static update(id: string, tenantData: TenantUpdate): Promise<ApiResponse<TenantType>>;
    /**
     * Delete a tenant
     */
    static delete(id: string): Promise<ApiResponse<boolean>>;
    /**
     * Get paginated tenants
     */
    static getPaginated(page?: number, limit?: number, filters?: {
        property_id?: string;
        is_active?: boolean;
        late_status?: string;
    }): Promise<ApiResponse<{
        data: TenantType[];
        total: number;
        page: number;
        limit: number;
        hasMore: boolean;
    }>>;
    /**
     * Search tenants
     */
    static search(searchTerm: string): Promise<ApiResponse<TenantType[]>>;
    /**
     * Get active tenants
     */
    static getActive(): Promise<ApiResponse<TenantType[]>>;
    /**
     * Get late tenants
     */
    static getLate(): Promise<ApiResponse<TenantType[]>>;
    /**
     * Get tenants by property
     */
    static getByProperty(propertyId: string): Promise<ApiResponse<TenantType[]>>;
    /**
     * Record a payment for a tenant
     */
    static recordPayment(tenantId: string, paymentData: {
        payment_date: string;
        amount: number;
    }): Promise<ApiResponse<TenantType>>;
    /**
     * Get late tenants with detailed information using existing database structure
     */
    static getLateTenants(): Promise<ApiResponse<any[]>>;
    /**
     * Calculate total amount due for a tenant using new pay period logic
     */
    static calculateTotalDue(tenant: TenantType): number;
    /**
     * Calculate days late based on last payment date
     */
    static calculateDaysLate(lastPaymentDate?: string): number;
    /**
     * Calculate late periods based on days late and rent cadence
     */
    static calculateLatePeriods(tenant: TenantType, daysLate: number): number;
    /**
     * Calculate late fees based on late periods and rent cadence
     */
    static calculateLateFees(tenant: TenantType, latePeriods: number): number;
    /**
     * Calculate total due including late fees
     */
    static calculateTotalDueWithLateFees(tenant: TenantType, lateFees: number): number;
    /**
     * Calculate what a tenant actually owes using the currently_paid_up_date
     * This is the new improved calculation system
     */
    static calculateTenantOwedAmount(tenant: TenantType): {
        totalOwed: number;
        totalLateFees: number;
        missedPeriods: number;
        missedPayments: Array<{
            dueDate: Date;
            amount: number;
            isLate: boolean;
            lateFee: number;
        }>;
    };
    /**
     * Calculate total days late for a tenant
     */
    static calculateTotalDaysLate(tenant: TenantType): number;
    /**
     * Get the late fee amount for a specific rent cadence
     */
    static getLateFeeAmount(cadence: string): number;
    /**
     * Extract rent cadence from property notes
     */
    static extractRentCadence(notes?: string): string;
    /**
     * Calculate the number of days between two dates
     */
    static daysBetween(date1: string | Date, date2: string | Date): number;
    /**
     * Get the expected payment date for a specific pay period
     */
    static getExpectedPaymentDate(leaseStartDate: string, payPeriodIndex: number, cadence: string): Date;
    /**
     * Get the last N expected payment dates for a tenant
     */
    static getLastExpectedPaymentDates(leaseStartDate: string, cadence: string, count?: number): Date[];
    /**
     * Calculate late fees for a specific pay period
     */
    static calculateLateFeesForPeriod(expectedDate: Date, paymentHistory: Array<{
        date: string;
        amount: number;
        status: string;
    }>, cadence: string, rentAmount: number): {
        isLate: boolean;
        daysLate: number;
        lateFees: number;
        totalPaid: number;
        outstanding: number;
    };
    /**
     * Calculate total late payments for a tenant
     */
    static calculateTotalLatePayments(tenant: TenantType, property: any): {
        totalDue: number;
        totalLateFees: number;
        latePeriods: number;
    };
    /**
     * Check if a tenant is late on payments
     */
    static isTenantLate(tenant: TenantType, property: any): boolean;
    /**
     * Create tenant by property address
     */
    static createByPropertyAddress(tenantData: {
        property_address: string;
        first_name: string;
        last_name: string;
        email?: string;
        phone?: string;
        emergency_contact_name?: string;
        emergency_contact_phone?: string;
        lease_start_date?: string;
        lease_end_date?: string;
        monthly_rent?: number;
        security_deposit?: number;
        notes?: string;
    }): Promise<ApiResponse<TenantType>>;
    /**
     * Bulk create tenants by property address
     */
    static bulkCreateByPropertyAddress(tenantsData: Array<{
        property_address: string;
        first_name: string;
        last_name: string;
        email?: string;
        phone?: string;
        emergency_contact_name?: string;
        emergency_contact_phone?: string;
        lease_start_date?: string;
        lease_end_date?: string;
        monthly_rent?: number;
        security_deposit?: number;
        notes?: string;
    }>): Promise<ApiResponse<{
        created: TenantType[];
        errors: string[];
    }>>;
    /**
     * Calculate total amount owed by a tenant
     */
    static calculateTotalAmountOwed(tenant: TenantType): number;
    /**
     * Get the rent amount for a tenant
     */
    static getRentAmount(tenant: TenantType): number;
    /**
     * Calculate days since last payment
     */
    static calculateDaysSinceLastPayment(tenant: TenantType): number;
    /**
     * Calculate days since lease start
     */
    static calculateDaysSinceLeaseStart(tenant: TenantType): number;
}
export {};
