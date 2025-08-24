import type { Transaction, CreateTransactionData, UpdateTransactionData, ApiResponse, PaginatedResponse } from '../types';
import type { TransactionUI } from '../types/ui';
export declare class TransactionsService {
    /**
     * Get all transactions with optional filtering
     */
    static getAll(filters?: {
        transaction_type?: string;
        tenant_id?: string;
        property_id?: string;
        payment_status?: string;
        start_date?: string;
        end_date?: string;
    }): Promise<ApiResponse<Transaction[]>>;
    /**
     * Get a transaction by ID
     */
    static getById(id: string): Promise<ApiResponse<TransactionUI<Transaction>>>;
    /**
     * Create a new transaction
     */
    static create(transactionData: CreateTransactionData): Promise<ApiResponse<Transaction>>;
    /**
     * Update an existing transaction
     */
    static update(id: string, transactionData: UpdateTransactionData): Promise<ApiResponse<Transaction>>;
    /**
     * Delete a transaction
     */
    static delete(id: string): Promise<ApiResponse<boolean>>;
    /**
     * Get paginated transactions
     */
    static getPaginated(page?: number, limit?: number, filters?: {
        transaction_type?: string;
        tenant_id?: string;
        property_id?: string;
        payment_status?: string;
        start_date?: string;
        end_date?: string;
    }): Promise<ApiResponse<PaginatedResponse<Transaction>>>;
    /**
     * Get rent payments
     */
    static getRentPayments(filters?: {
        tenant_id?: string;
        property_id?: string;
        start_date?: string;
        end_date?: string;
    }): Promise<ApiResponse<Transaction[]>>;
    /**
     * Get loan payments
     */
    static getLoanPayments(filters?: {
        loan_id?: string;
        property_id?: string;
        start_date?: string;
        end_date?: string;
    }): Promise<ApiResponse<Transaction[]>>;
    /**
     * Get transactions by date range
     */
    static getByDateRange(startDate: string, endDate: string): Promise<ApiResponse<Transaction[]>>;
    /**
     * Get total income for a date range
     */
    static getTotalIncome(startDate: string, endDate: string): Promise<ApiResponse<number>>;
    /**
     * Get total expenses for a date range
     */
    static getTotalExpenses(startDate: string, endDate: string): Promise<ApiResponse<number>>;
}
