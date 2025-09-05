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
          purchase_date,
          current_value,
          is_for_rent,
          is_for_sale,
          insurance_premium,
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

      // Get lease status for all properties
      const leaseStatusResponse = await LeasesService.getAllPropertiesWithLeaseStatus();
      
      if (!leaseStatusResponse.success || !leaseStatusResponse.data) {
        // Return properties without lease status rather than failing completely
        return createApiResponse(properties as Property[]);
      }

      const leaseStatusMap = new Map(
        leaseStatusResponse.data.map(item => [item.property_id, item])
      );

      // Attach lease status and update property status based on active leases
      const propertiesWithLeaseStatus = (properties as Property[]).map(property => {
        const leaseStatus = leaseStatusMap.get(property.id);
        const hasActiveLeases = leaseStatus?.has_active_lease || false;
        
        // Update property status based on active leases
        const newStatus = hasActiveLeases ? 'rented' : 'empty';
        
        return {
          ...property,
          status: newStatus as any, // Cast to avoid type issues
          active_leases: leaseStatus?.active_leases || [],
          active_lease_count: leaseStatus?.active_lease_count || 0
        };
      });

      return createApiResponse(propertiesWithLeaseStatus);
    } catch (error) {
      console.error('PropertiesService.getAll exception:', error);
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Get a property by ID
   */
  static async getById(id: string): Promise<ApiResponse<PropertyUI<Property>>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('RENT_properties')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      // Fetch tenants for this property (only active ones)
      const { data: tenantsData } = await supabase
        .from('RENT_tenants')
        .select('*')
        .eq('property_id', id)
        .eq('is_active', true);

      const propertyWithTenants = {
        ...data,
        tenants: tenantsData || []
      };

      return createApiResponse(propertyWithTenants as unknown as PropertyUI<Property>);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Create a new property
   */
  static async create(propertyData: CreatePropertyData): Promise<ApiResponse<Property>> {
    try {
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase
        .from('RENT_properties')
        .insert([propertyData])
        .select()
        .single();

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      return createApiResponse(data as Property);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Update an existing property
   */
  static async update(id: string, propertyData: Omit<UpdatePropertyData, 'id'>): Promise<ApiResponse<Property>> {
    try {
      console.log('🔍 PropertiesService.update - Updating property:', id, 'with data:', propertyData)
      
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('RENT_properties')
        .update(propertyData)
        .eq('id', id)
        .select()
        .single();

      console.log('🔍 PropertiesService.update - Supabase response:', { data, error })

      if (error) {
        console.error('❌ PropertiesService.update - Supabase error:', error)
        return createApiResponse(null, handleSupabaseError(error));
      }

      console.log('✅ PropertiesService.update - Successfully updated property:', data)
      return createApiResponse(data as Property);
    } catch (error) {
      console.error('💥 PropertiesService.update - Unexpected error:', error)
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Delete a property
   */
  static async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('RENT_properties')
        .delete()
        .eq('id', id);

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      return createApiResponse(true);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Get paginated properties
   */
  static async getPaginated(
    page: number = 1,
    limit: number = 10,
    filters?: {
      is_for_rent?: boolean;
      is_for_sale?: boolean;
      city?: string;
      state?: string;
    }
  ): Promise<ApiResponse<PaginatedResponse<Property>>> {
    try {
      const supabase = getSupabaseClient();
      const offset = (page - 1) * limit;

      let query = supabase
        .from('RENT_properties')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

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

      const { data, error, count } = await query;

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      // Fetch tenants for each property
      const propertiesWithTenants = await Promise.all(
        (data as Property[]).map(async (property) => {
          const { data: tenantsData } = await supabase
            .from('RENT_tenants')
            .select('*')
            .eq('property_id', property.id);
          
          return {
            ...property,
            tenants: tenantsData || []
          };
        })
      );

      const total = count || 0;
      const hasMore = offset + limit < total;

      const response: PaginatedResponse<Property> = {
        data: propertiesWithTenants as Property[],
        total,
        page,
        limit,
        hasMore
      };

      return createApiResponse(response);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Search properties
   */
  static async search(searchTerm: string): Promise<ApiResponse<Property[]>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('RENT_properties')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      // Fetch tenants for each property
      const propertiesWithTenants = await Promise.all(
        (data as Property[]).map(async (property) => {
          const { data: tenantsData } = await supabase
            .from('RENT_tenants')
            .select('*')
            .eq('property_id', property.id);
          
          return {
            ...property,
            tenants: tenantsData || []
          };
        })
      );

      return createApiResponse(propertiesWithTenants as Property[]);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Get properties available for rent
   */
  static async getAvailableForRent(): Promise<ApiResponse<Property[]>> {
    return this.getAll({ is_for_rent: true });
  }

  /**
   * Get properties available for sale
   */
  static async getAvailableForSale(): Promise<ApiResponse<Property[]>> {
    return this.getAll({ is_for_sale: true });
  }
} 