interface CollectionsParams {
    start: string;
    end: string;
    tenantId?: string;
    propertyId?: string;
}
interface CollectionsResult {
    totalCollected: number;
    paymentCount: number;
    dateRange: {
        start: string;
        end: string;
    };
    breakdown: {
        byTenant?: Array<{
            tenantId: string;
            tenantName: string;
            amount: number;
            paymentCount: number;
        }>;
        byProperty?: Array<{
            propertyId: string;
            propertyName: string;
            amount: number;
            paymentCount: number;
        }>;
    };
}
/**
 * Get total collections for a date range with optional tenant/property filters
 */
export declare function getCollectedTotal(params: CollectionsParams): Promise<CollectionsResult>;
/**
 * Get collections summary for dashboard
 */
export declare function getCollectionsSummary(): Promise<{
    thisMonth: number;
    lastMonth: number;
    thisYear: number;
    lastYear: number;
}>;
export {};
