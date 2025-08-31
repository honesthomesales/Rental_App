import type { ApiResponse } from '../types';
export interface RentPeriodGenerationResult {
    success: boolean;
    message: string;
    periodsCreated: number;
    periodsUpdated: number;
}
export declare class RentPeriodsService {
    static generateRentPeriods(leaseId: string, tenantId: string, propertyId: string, startDate: string, endDate: string, rentAmount: number, cadence: string, dueDay?: number): Promise<ApiResponse<RentPeriodGenerationResult>>;
    static getTenantRentPeriodSummary(tenantId: string): Promise<ApiResponse<any>>;
}
