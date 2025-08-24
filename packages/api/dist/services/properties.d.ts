import type { Property, CreatePropertyData, UpdatePropertyData, ApiResponse, PaginatedResponse } from '../types';
import type { PropertyUI } from '../types/ui';
export declare class PropertiesService {
    /**
     * Get all properties with optional filtering
     */
    static getAll(filters?: {
        is_for_rent?: boolean;
        is_for_sale?: boolean;
        city?: string;
        state?: string;
    }): Promise<ApiResponse<Property[]>>;
    /**
     * Get a property by ID
     */
    static getById(id: string): Promise<ApiResponse<PropertyUI<Property>>>;
    /**
     * Create a new property
     */
    static create(propertyData: CreatePropertyData): Promise<ApiResponse<Property>>;
    /**
     * Update an existing property
     */
    static update(id: string, propertyData: Omit<UpdatePropertyData, 'id'>): Promise<ApiResponse<Property>>;
    /**
     * Delete a property
     */
    static delete(id: string): Promise<ApiResponse<boolean>>;
    /**
     * Get paginated properties
     */
    static getPaginated(page?: number, limit?: number, filters?: {
        is_for_rent?: boolean;
        is_for_sale?: boolean;
        city?: string;
        state?: string;
    }): Promise<ApiResponse<PaginatedResponse<Property>>>;
    /**
     * Search properties
     */
    static search(searchTerm: string): Promise<ApiResponse<Property[]>>;
    /**
     * Get properties available for rent
     */
    static getAvailableForRent(): Promise<ApiResponse<Property[]>>;
    /**
     * Get properties available for sale
     */
    static getAvailableForSale(): Promise<ApiResponse<Property[]>>;
}
