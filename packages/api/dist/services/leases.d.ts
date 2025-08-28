import type { Lease, ApiResponse } from '../types';
export declare class LeasesService {
    /**
     * Get all leases
     */
    static getAll(): Promise<ApiResponse<Lease[]>>;
    /**
     * Get leases for a specific property
     */
    static getByPropertyId(propertyId: string): Promise<ApiResponse<Lease[]>>;
    /**
     * Get active leases for a property (current date is between start and end dates)
     */
    static getActiveLeasesByPropertyId(propertyId: string): Promise<ApiResponse<Lease[]>>;
    /**
     * Check if a property has active leases
     */
    static hasActiveLeases(propertyId: string): Promise<ApiResponse<boolean>>;
    /**
     * Create a new lease
     */
    static create(leaseData: Omit<Lease, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Lease>>;
    /**
     * Update an existing lease
     */
    static update(id: string, updateData: Partial<Lease>): Promise<ApiResponse<Lease>>;
    /**
     * Delete a lease
     */
    static delete(id: string): Promise<ApiResponse<boolean>>;
    /**
     * Update lease status based on current date
     */
    static updateLeaseStatus(leaseId: string): Promise<ApiResponse<Lease>>;
    /**
     * Get all properties with their lease status and active leases
     */
    static getAllPropertiesWithLeaseStatus(): Promise<ApiResponse<Array<{
        property_id: string;
        has_active_lease: boolean;
        active_leases: Lease[];
        active_lease_count: number;
    }>>>;
}
