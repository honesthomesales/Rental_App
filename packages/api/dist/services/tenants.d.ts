import type { Tenant, CreateTenantData, UpdateTenantData, ApiResponse, PaginatedResponse, LateTenant } from '../types';
import type { TenantUI } from '../types/ui';
export declare class TenantsService {
    /**
     * Get all tenants with optional filtering
     */
    static getAll(filters?: {
        property_id?: string;
        is_active?: boolean;
        late_status?: string;
    }): Promise<ApiResponse<Tenant[]>>;
    /**
     * Get a tenant by ID
     */
    static getById(id: string): Promise<ApiResponse<TenantUI<Tenant>>>;
    /**
     * Create a new tenant
     */
    static create(tenantData: CreateTenantData): Promise<ApiResponse<Tenant>>;
    /**
     * Update an existing tenant
     */
    static update(id: string, tenantData: UpdateTenantData): Promise<ApiResponse<Tenant>>;
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
    }): Promise<ApiResponse<PaginatedResponse<Tenant>>>;
    /**
     * Search tenants
     */
    static search(searchTerm: string): Promise<ApiResponse<Tenant[]>>;
    /**
     * Get active tenants
     */
    static getActive(): Promise<ApiResponse<Tenant[]>>;
    /**
     * Get late tenants
     */
    static getLate(): Promise<ApiResponse<Tenant[]>>;
    /**
     * Get tenants by property
     */
    static getByProperty(propertyId: string): Promise<ApiResponse<Tenant[]>>;
    /**
     * Record a payment for a tenant using new pay period calculation
     */
    static recordPayment(tenantId: string, paymentData: {
        amount: number;
        payment_date: string;
        description?: string;
        reference_number?: string;
    }): Promise<ApiResponse<Tenant>>;
    /**
     * Get late tenants with detailed information using existing database structure
     */
    static getLateTenants(): Promise<ApiResponse<LateTenant[]>>;
    /**
     * Calculate total amount due for a tenant using new pay period logic
     */
    static calculateTotalDue(tenant: Tenant): number;
    /**
     * Calculate days late based on last payment date
     */
    static calculateDaysLate(lastPaymentDate?: string): number;
    /**
     * Calculate late periods based on days late and rent cadence
     */
    static calculateLatePeriods(tenant: Tenant, daysLate: number): number;
    /**
     * Calculate late fees based on late periods and rent cadence
     */
    static calculateLateFees(tenant: Tenant, latePeriods: number): number;
    /**
     * Calculate total due including late fees
     */
    static calculateTotalDueWithLateFees(tenant: Tenant, lateFees: number): number;
    /**
     * Calculate what a tenant actually owes using the currently_paid_up_date
     * This is the new improved calculation system
     */
    static calculateTenantOwedAmount(tenant: Tenant): {
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
     * Calculate days late from the currently paid up date
     */
    static calculateDaysLateFromPaidUpDate(tenant: Tenant): number;
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
     * Calculate total late payments for a tenant over the last 12 pay periods
     */
    static calculateTotalLatePayments(tenant: Tenant, property: any): {
        totalLateFees: number;
        totalOutstanding: number;
        totalDue: number;
        latePeriods: number;
        payPeriods: Array<{
            expectedDate: Date;
            isLate: boolean;
            daysLate: number;
            lateFees: number;
            totalPaid: number;
            outstanding: number;
        }>;
    };
    /**
     * Check if a tenant is currently late based on the new calculation system
     */
    static isTenantLate(tenant: Tenant, property: any): boolean;
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
    }): Promise<ApiResponse<Tenant>>;
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
        created: Tenant[];
        errors: string[];
    }>>;
    /**
     * Unlink a tenant from their property
     */
    static unlinkTenantFromProperty(tenantId: string): Promise<ApiResponse<Tenant>>;
    /**
     * Clear the tenants cache
     */
    static clearCache(): void;
    /**
     * Get rent periods for a specific tenant
     */
    static getTenantRentPeriods(tenantId: string): Promise<ApiResponse<any[]>>;
}
