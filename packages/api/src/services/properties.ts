import { getSupabaseClient, handleSupabaseError, createApiResponse } from '../client';
import type { Property, CreatePropertyData, UpdatePropertyData, ApiResponse, PaginatedResponse } from '../types';

// Simple in-memory cache for properties with shorter TTL for better performance
const propertiesCache = new Map<string, { data: Property[], timestamp: number }>();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for faster updates

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
      // Check cache first
      const cacheKey = JSON.stringify(filters || {});
      const cached = propertiesCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return createApiResponse(cached.data);
      }

      const supabase = getSupabaseClient();
      
      if (!supabase) {
        return createApiResponse(null, 'Supabase client not available');
      }
      
      // Use a more efficient query with left join to get tenants in one query
      let query = supabase!
        .from('RENT_properties')
        .select(`
          *,
          RENT_tenants!RENT_tenants_property_id_fkey (
            id,
            first_name,
            last_name,
            email,
            phone,
            is_active,
            lease_start_date,
            lease_end_date
          )
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

      const { data: propertiesWithTenants, error } = await query;

      if (error) {
        console.error('PropertiesService.getAll error:', error);
        return createApiResponse(null, handleSupabaseError(error));
      }

      // Transform the data to match the expected format
      const properties = (propertiesWithTenants as any[]).map(property => ({
        ...property,
        tenants: property.RENT_tenants || []
      }));

      // Cache the result
      propertiesCache.set(cacheKey, { data: properties, timestamp: Date.now() });

      return createApiResponse(properties);
    } catch (error) {
      console.error('PropertiesService.getAll exception:', error);
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Clear the properties cache
   */
  static clearCache(): void {
    propertiesCache.clear();
  }

  /**
   * Get a property by ID
   */
  static async getById(id: string): Promise<ApiResponse<Property>> {
    try {
      const supabase = getSupabaseClient();
      
      if (!supabase) {
        return createApiResponse(null, 'Supabase client not available');
      }
      
      const { data, error } = await supabase!
        .from('RENT_properties')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      // Fetch tenants for this property
      const { data: tenantsData } = await supabase!
        .from('RENT_tenants')
        .select('*')
        .eq('property_id', id);

      const propertyWithTenants = {
        ...data,
        tenants: tenantsData || []
      };

      return createApiResponse(propertyWithTenants as Property);
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
      
      if (!supabase) {
        return createApiResponse(null, 'Supabase client not available');
      }
      
      const { data, error } = await supabase!
        .from('RENT_properties')
        .insert([propertyData])
        .select()
        .single();

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      // Clear cache after creating new property
      this.clearCache();

      return createApiResponse(data as Property);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Update an existing property
   */
  static async update(propertyData: UpdatePropertyData): Promise<ApiResponse<Property>> {
    try {
      const supabase = getSupabaseClient();
      
      if (!supabase) {
        return createApiResponse(null, 'Supabase client not available');
      }
      
      const { id, ...updateData } = propertyData;

      const { data, error } = await supabase!
        .from('RENT_properties')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      // Clear cache after updating property
      this.clearCache();

      return createApiResponse(data as Property);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Delete a property
   */
  static async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const supabase = getSupabaseClient();
      
      if (!supabase) {
        return createApiResponse(null, 'Supabase client not available');
      }
      
      const { error } = await supabase!
        .from('RENT_properties')
        .delete()
        .eq('id', id);

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      // Clear cache after deleting property
      this.clearCache();

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
      
      if (!supabase) {
        return createApiResponse(null, 'Supabase client not available');
      }
      
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
        data: propertiesWithTenants,
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
      
      if (!supabase) {
        return createApiResponse(null, 'Supabase client not available');
      }
      
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

      return createApiResponse(propertiesWithTenants);
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

  /**
   * Update property status based on whether it has tenants
   */
  static async updatePropertyStatus(propertyId: string): Promise<ApiResponse<boolean>> {
    try {
      const supabase = getSupabaseClient();
      
      if (!supabase) {
        return createApiResponse(null, 'Supabase client not available');
      }
      
      // Check if property has active tenants
      const { data: tenants, error: tenantsError } = await supabase
        .from('RENT_tenants')
        .select('id')
        .eq('property_id', propertyId)
        .eq('is_active', true);

      if (tenantsError) {
        return createApiResponse(null, handleSupabaseError(tenantsError));
      }

      // Determine new status
      const hasTenants = tenants && tenants.length > 0;
      const newStatus = hasTenants ? 'rented' : 'empty';

      // Update property status
      const { error: updateError } = await supabase
        .from('RENT_properties')
        .update({ status: newStatus })
        .eq('id', propertyId);

      if (updateError) {
        return createApiResponse(null, handleSupabaseError(updateError));
      }

      return createApiResponse(true);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Bulk update all property statuses based on tenant occupancy
   */
  static async updateAllPropertyStatuses(): Promise<ApiResponse<number>> {
    try {
      const supabase = getSupabaseClient();
      
      if (!supabase) {
        return createApiResponse(null, 'Supabase client not available');
      }
      
      // Get all properties
      const { data: properties, error: propertiesError } = await supabase
        .from('RENT_properties')
        .select('id');

      if (propertiesError) {
        return createApiResponse(null, handleSupabaseError(propertiesError));
      }

      let updatedCount = 0;

      // Update each property's status
      for (const property of properties || []) {
        const result = await this.updatePropertyStatus(property.id);
        if (result.success) {
          updatedCount++;
        }
      }

      return createApiResponse(updatedCount);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }
} 