import type { ApiResponse } from '../types';
export interface Payment {
    id: string;
    payment_date: string;
    amount: number;
    property_id: string;
    tenant_id: string;
    payment_type: string;
    notes: string;
    created_at: string;
}
export interface CreatePaymentData {
    payment_date: string;
    amount: number;
    property_id: string;
    tenant_id: string;
    payment_type: string;
    notes?: string;
}
export interface UpdatePaymentData {
    payment_date?: string;
    amount?: number;
    property_id?: string;
    tenant_id?: string;
    payment_type?: string;
    notes?: string;
}
export declare class PaymentsService {
    /**
     * Get all payments
     */
    static getAll(): Promise<{
        data: {
            amount: number;
            created_at: string | null;
            date_paid: string | null;
            id: string;
            lease_id: string | null;
            notes: string | null;
            payment_date: string;
            payment_method: string | null;
            payment_type: string;
            property_id: string | null;
            status: string | null;
            tenant_id: string | null;
            updated_at: string | null;
        }[] | null;
        error: string | null;
        success: boolean;
    }>;
    /**
     * Get payments by date range for efficient loading
     */
    static getByDateRange(startDate: string, endDate: string): Promise<ApiResponse<Payment[]>>;
    /**
     * Get the most recent month that has payments
     */
    static getMostRecentMonthWithPayments(): Promise<ApiResponse<{
        year: number;
        month: number;
    }>>;
    /**
     * Get properties with their active tenants for the payments grid
     */
    static getPropertiesWithTenants(): Promise<ApiResponse<any[]>>;
    /**
     * Create a payment
     */
    static createPayment(paymentData: CreatePaymentData): Promise<ApiResponse<Payment>>;
    /**
     * Update a payment
     */
    static updatePayment(paymentId: string, updateData: UpdatePaymentData): Promise<ApiResponse<Payment>>;
    /**
     * Delete a payment
     */
    static deletePayment(paymentId: string): Promise<ApiResponse<boolean>>;
    /**
     * Get payments for a specific property and date range
     */
    static getByPropertyAndDateRange(propertyId: string, startDate: string, endDate: string): Promise<ApiResponse<Payment[]>>;
}
