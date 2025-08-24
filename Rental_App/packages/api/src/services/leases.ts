import { getSupabaseClient, handleSupabaseError, createApiResponse } from '../client';
import type { Lease, ApiResponse } from '../types';

export class LeasesService {
  /**
   * Get all leases
   */
  static async getAll(): Promise<ApiResponse<Lease[]>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('RENT_leases')
        .select('*')
        .order('lease_start_date', { ascending: false });

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      return createApiResponse(data as Lease[]);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Get leases for a specific property
   */
  static async getByPropertyId(propertyId: string): Promise<ApiResponse<Lease[]>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('RENT_leases')
        .select('*')
        .eq('property_id', propertyId)
        .order('lease_start_date', { ascending: false });

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      return createApiResponse(data as Lease[]);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Get active leases for a property (current date is between start and end dates)
   */
  static async getActiveLeasesByPropertyId(propertyId: string): Promise<ApiResponse<Lease[]>> {
    try {
      const supabase = getSupabaseClient();
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('RENT_leases')
        .select('*')
        .eq('property_id', propertyId)
        .lte('lease_start_date', today)
        .gte('lease_end_date', today)
        .order('lease_start_date', { ascending: false });

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      return createApiResponse(data as Lease[]);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Check if a property has active leases
   */
  static async hasActiveLeases(propertyId: string): Promise<ApiResponse<boolean>> {
    try {
      const activeLeasesResponse = await this.getActiveLeasesByPropertyId(propertyId);
      
      if (!activeLeasesResponse.success) {
        return createApiResponse(false);
      }

      const hasActiveLeases = activeLeasesResponse.data && activeLeasesResponse.data.length > 0;
      return createApiResponse(hasActiveLeases);
    } catch (error) {
      return createApiResponse(false);
    }
  }

  /**
   * Create a new lease
   */
  static async create(leaseData: Omit<Lease, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Lease>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('RENT_leases')
        .insert([leaseData])
        .select()
        .single();

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      return createApiResponse(data as Lease);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Update an existing lease
   */
  static async update(id: string, updateData: Partial<Lease>): Promise<ApiResponse<Lease>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('RENT_leases')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      return createApiResponse(data as Lease);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Delete a lease
   */
  static async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('RENT_leases')
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
   * Update lease status based on current date
   */
  static async updateLeaseStatus(leaseId: string): Promise<ApiResponse<Lease>> {
    try {
      const supabase = getSupabaseClient();
      const today = new Date().toISOString().split('T')[0];
      
      // Get the lease
      const { data: lease, error: fetchError } = await supabase
        .from('RENT_leases')
        .select('*')
        .eq('id', leaseId)
        .single();

      if (fetchError) {
        return createApiResponse(null, handleSupabaseError(fetchError));
      }

      // Determine status based on dates
      let newStatus = 'active';
      if (today < lease.lease_start_date) {
        newStatus = 'pending';
      } else if (today > lease.lease_end_date) {
        newStatus = 'expired';
      }

      // Update status if it changed
      if (lease.status !== newStatus) {
        return await this.update(leaseId, { status: newStatus });
      }

      return createApiResponse(lease as Lease);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Get all properties with their active lease status
   */
  static async getAllPropertiesWithLeaseStatus(): Promise<ApiResponse<Array<{
    property_id: string;
    has_active_lease: boolean;
    active_lease_count: number;
    active_leases: Lease[];
  }>>> {
    try {
      const supabase = getSupabaseClient();
      
      // Get all leases with status = 'active'
      const { data: activeLeases, error } = await supabase
        .from('RENT_leases')
        .select('*')
        .eq('status', 'active');

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      // Group active leases by property
      const propertyLeaseMap = new Map<string, Lease[]>();
      (activeLeases || []).forEach(lease => {
        if (!propertyLeaseMap.has(lease.property_id)) {
          propertyLeaseMap.set(lease.property_id, []);
        }
        propertyLeaseMap.get(lease.property_id)!.push(lease);
      });

      // Get all properties
      const { data: properties, error: propertiesError } = await supabase
        .from('RENT_properties')
        .select('id');

      if (propertiesError) {
        return createApiResponse(null, handleSupabaseError(propertiesError));
      }

      // Create result array
      const result = (properties || []).map(property => {
        const activeLeases = propertyLeaseMap.get(property.id) || [];
        return {
          property_id: property.id,
          has_active_lease: activeLeases.length > 0,
          active_lease_count: activeLeases.length,
          active_leases: activeLeases
        };
      });

      return createApiResponse(result);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }
}
