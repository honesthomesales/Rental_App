import { getSupabaseClient, handleSupabaseError, createApiResponse } from '../client';
import type { Property, CreatePropertyData, UpdatePropertyData, ApiResponse, PaginatedResponse } from '../types';

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
      let query = supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

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

      const { data, error } = await query;

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      return createApiResponse(data as Property[]);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Get a property by ID
   */
  static async getById(id: string): Promise<ApiResponse<Property>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
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
   * Create a new property
   */
  static async create(propertyData: CreatePropertyData): Promise<ApiResponse<Property>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('properties')
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
  static async update(propertyData: UpdatePropertyData): Promise<ApiResponse<Property>> {
    try {
      const supabase = getSupabaseClient();
      const { id, ...updateData } = propertyData;

      const { data, error } = await supabase
        .from('properties')
        .update(updateData)
        .eq('id', id)
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
   * Delete a property
   */
  static async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('properties')
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
        .from('properties')
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

      const total = count || 0;
      const hasMore = offset + limit < total;

      const response: PaginatedResponse<Property> = {
        data: data as Property[],
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
        .from('properties')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      return createApiResponse(data as Property[]);
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