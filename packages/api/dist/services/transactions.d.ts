import type { Transaction, CreateTransactionData, UpdateTransactionData, ApiResponse } from '../types';
interface TransactionUI<T> extends Transaction {
    tenant?: any;
    property?: any;
    lease?: any;
}
export declare class TransactionsService {
    static getAll(): Promise<ApiResponse<Transaction[]>>;
    static getById(id: string): Promise<ApiResponse<TransactionUI<Transaction>>>;
    static create(transactionData: CreateTransactionData): Promise<ApiResponse<Transaction>>;
    static update(id: string, transactionData: UpdateTransactionData): Promise<ApiResponse<Transaction>>;
    static delete(id: string): Promise<ApiResponse<boolean>>;
    static getByTenant(tenantId: string): Promise<ApiResponse<Transaction[]>>;
    static getByProperty(propertyId: string): Promise<ApiResponse<Transaction[]>>;
    static getTotalByTenant(tenantId: string): Promise<ApiResponse<number>>;
    static getTotalByProperty(propertyId: string): Promise<ApiResponse<number>>;
}
export {};
