import { getSupabaseClient, handleSupabaseError, createApiResponse } from '../client';
import type { Property, CreatePropertyData, UpdatePropertyData, ApiResponse, PaginatedResponse } from '../types';
import type { PropertyUI } from '../types/ui';
import { LeasesService } from './leases';

export class PropertiesService {
  /**
   * Get all properties with optional filtering
   */
  static async getAll(filters?: {
    is_for_rent?: boolean;
    is_for_sale?: boolean;
    city?: string;
    state?: string;
  }): Promise<ApiResponse<Property[]>> {
    try {
      const supabase = getSupabaseClient();
      
      // Build the base query with field selection to reduce payload
      let query = supabase
        .from('RENT_properties')
        .select(`
          id,
          name,
          address,
          city,
          state,
          zip_code,
          property_type,
          status,
          bedrooms,
          bathrooms,
          square_feet,
          year_built,
          purchase_price,
          purchase_payment,
          purchase_date,
          current_value,
          monthly_rent,
          is_for_rent,
          is_for_sale,
          insurance_premium,
          property_tax,
          notes,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.is_for_rent !== undefined) {
        query = query.eq('is_for_rent', filters.is_for_rent);
      }
      if (filters?.is_for_sale !== undefined) {
        query = query.eq('is_for_sale', filters.is_for_sale);
      }
      if (filters?.city) {
        query = query.eq('city', filters.city);
      }
      if (filters?.state) {
        query = query.eq('state', filters.state);
      }

      const { data: properties, error } = await query;
      if (error) {
        console.error('PropertiesService.getAll error:', error);
        return createApiResponse(null, handleSupabaseError(error));
      }

      // Get tenant information for all properties
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('RENT_tenants')
        .select('id, first_name, last_name, property_id, is_active')
        .eq('is_active', true);

      if (tenantsError) {
        console.error('Error fetching tenants:', tenantsError);
      }

      const tenantsMap = new Map();
      if (tenantsData) {
        tenantsData.forEach((tenant: any) => {
          if (!tenantsMap.has(tenant.property_id)) {
            tenantsMap.set(tenant.property_id, []);
          }
          tenantsMap.get(tenant.property_id).push(tenant);
        });
      }

      // Get active leases for all properties
      const { data: leasesData, error: leasesError } = await supabase
        .from('RENT_leases')
        .select('*');

      if (leasesError) {
        console.error('Error fetching leases:', leasesError);
      }

      const today = new Date().toISOString().split('T')[0];
      const activeLeasesMap = new Map();
      if (leasesData) {
        leasesData.forEach((lease: any) => {
          const isActive = lease.lease_start_date <= today && lease.lease_end_date >= today;
          if (isActive) {
            if (!activeLeasesMap.has(lease.property_id)) {
              activeLeasesMap.set(lease.property_id, []);
            }
            activeLeasesMap.get(lease.property_id).push(lease);
          }
        });
      }

      // Attach tenant and lease information
      const propertiesWithDetails = properties.map((property: any) => {
        const propertyTenants = tenantsMap.get(property.id) || [];
        const activeLeases = activeLeasesMap.get(property.id) || [];
        const hasActiveLeases = activeLeases.length > 0;
        
        // Update property status based on active leases
        const newStatus = hasActiveLeases ? 'rented' : property.status;
        
        return {
          ...property,
          status: newStatus,
          active_leases: activeLeases,
          active_lease_count: activeLeases.length,
          tenants: propertyTenants
        };
      });

      return createApiResponse(propertiesWithDetails);
    } catch (error) {
      console.error('PropertiesService.getAll exception:', error);
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Get a property by ID
   */
  static async getById(id: string): Promise<ApiResponse<PropertyUI<Property>>> {
    return createApiResponse<PropertyUI<Property>>(null, 'Property not found');
  }

  /**
   * Create a new property
   */
  static async create(propertyData: CreatePropertyData): Promise<ApiResponse<Property>> {
    return createApiResponse<Property>(null, 'Not implemented');
  }

  /**
   * Update an existing property
   */
  static async update(id: string, propertyData: Omit<UpdatePropertyData, 'id'>): Promise<ApiResponse<Property>> {
    return createApiResponse<Property>(null, 'Not implemented');
  }

  /**
   * Delete a property
   */
  static async delete(id: string): Promise<ApiResponse<boolean>> {
    return createApiResponse<boolean>(false, 'Not implemented');
  }

  /**
   * Get paginated properties
   */
  static async getPaginated(page?: number, limit?: number, filters?: {
    is_for_rent?: boolean;
    is_for_sale?: boolean;
    city?: string;
    state?: string;
  }): Promise<ApiResponse<PaginatedResponse<Property>>> {
    return createApiResponse<PaginatedResponse<Property>>({
      data: [],
      total: 0,
      page: page || 1,
      limit: limit || 10,
      totalPages: 0
    }, null);
  }

  /**
   * Search properties
   */
  static async search(searchTerm: string): Promise<ApiResponse<Property[]>> {
    return createApiResponse<Property[]>([], null);
  }

  /**
   * Get properties available for rent
   */
  static async getAvailableForRent(): Promise<ApiResponse<Property[]>> {
    return createApiResponse<Property[]>([], null);
  }

  /**
   * Get properties available for sale
   */
  static async getAvailableForSale(): Promise<ApiResponse<Property[]>> {
    return createApiResponse<Property[]>([], null);
  }
} 