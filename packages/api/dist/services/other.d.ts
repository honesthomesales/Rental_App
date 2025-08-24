import type { ApiResponse } from '../types';
export interface OtherEntry {
    id: string;
    date: string;
    type: 'expense' | 'income';
    amount: number;
    description: string;
    created_at: string;
    updated_at: string;
}
export interface CreateOtherEntryData {
    date: string;
    type: 'expense' | 'income';
    amount: number;
    description: string;
}
export interface UpdateOtherEntryData extends Partial<CreateOtherEntryData> {
    id: string;
}
export declare class OtherService {
    /**
     * Get all other entries
     */
    static getAll(): Promise<ApiResponse<OtherEntry[]>>;
    /**
     * Get other entries by date range
     */
    static getByDateRange(startDate: string, endDate: string): Promise<ApiResponse<OtherEntry[]>>;
    /**
     * Create a new other entry
     */
    static create(entryData: CreateOtherEntryData): Promise<ApiResponse<OtherEntry>>;
    /**
     * Update an other entry
     */
    static update(entryData: UpdateOtherEntryData): Promise<ApiResponse<OtherEntry>>;
    /**
     * Delete an other entry
     */
    static delete(id: string): Promise<ApiResponse<boolean>>;
}
