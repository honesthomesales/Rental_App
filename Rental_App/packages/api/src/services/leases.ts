import { getSupabaseClient, handleSupabaseError, createApiResponse } from '../client';
import type { Lease, ApiResponse, PaginatedResponse } from '../types';

export interface CreateLeaseData {
  tenant_id: string;
  property_id: string;
  lease_start_date: string;
  lease_end_date: string;
  rent: number;
  rent_cadence: string;
  rent_due_day?: number;
  move_in_fee?: number;
  late_fee_amount?: number;
  status?: string;
  notes?: string;
}

export interface UpdateLeaseData extends Partial<CreateLeaseData> {
  id: string;
}

export class LeasesService {
  /**
   * Get all leases with optional filtering
   */
  static async getAll(filters?: {
    tenant_id?: string;
    property_id?: string;
    status?: string;
  }): Promise<ApiResponse<Lease[]>> {
    try {
      const supabase = getSupabaseClient();
      let query = supabase
        .from('RENT_leases')
        .select(`
          *,
          tenant:RENT_tenants(id, first_name, last_name, email),
          property:RENT_properties(id, name, address, city, state)
        `)
        .order('created_at', { ascending: false });

      if (filters?.tenant_id) {
        query = query.eq('tenant_id', filters.tenant_id);
      }

      if (filters?.property_id) {
        query = query.eq('property_id', filters.property_id);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data: leases, error } = await query;

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      return createApiResponse(leases as Lease[]);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Get a lease by ID
   */
  static async getById(id: string): Promise<ApiResponse<Lease>> {
    try {
      const supabase = getSupabaseClient();
      const { data: lease, error } = await supabase
        .from('RENT_leases')
        .select(`
          *,
          tenant:RENT_tenants(id, first_name, last_name, email, phone),
          property:RENT_properties(id, name, address, city, state, monthly_rent)
        `)
        .eq('id', id)
        .single();

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      return createApiResponse(lease as Lease);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Create a new lease
   */
  static async create(leaseData: CreateLeaseData): Promise<ApiResponse<Lease>> {
    try {
      const supabase = getSupabaseClient();
      
      // Validate that tenant and property exist
      const { data: tenant, error: tenantError } = await supabase
        .from('RENT_tenants')
        .select('id')
        .eq('id', leaseData.tenant_id)
        .single();

      if (tenantError || !tenant) {
        return createApiResponse(null, 'Tenant not found');
      }

      const { data: property, error: propertyError } = await supabase
        .from('RENT_properties')
        .select('id')
        .eq('id', leaseData.property_id)
        .single();

      if (propertyError || !property) {
        return createApiResponse(null, 'Property not found');
      }

      // Create the lease
      const { data, error } = await supabase
        .from('RENT_leases')
        .insert([{
          tenant_id: leaseData.tenant_id,
          property_id: leaseData.property_id,
          lease_start_date: leaseData.lease_start_date,
          lease_end_date: leaseData.lease_end_date,
          rent: leaseData.rent,
          rent_cadence: leaseData.rent_cadence,
          move_in_fee: leaseData.move_in_fee || 0,
          late_fee_amount: leaseData.late_fee_amount || 50,
          status: leaseData.status || 'active',
          notes: leaseData.notes
        }])
        .select(`
          *,
          tenant:RENT_tenants(id, first_name, last_name, email),
          property:RENT_properties(id, name, address, city, state)
        `)
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
  static async update(leaseData: UpdateLeaseData): Promise<ApiResponse<Lease>> {
    try {
      const supabase = getSupabaseClient();
      
      // Check if lease exists
      const { data: existingLease, error: checkError } = await supabase
        .from('RENT_leases')
        .select('id')
        .eq('id', leaseData.id)
        .single();

      if (checkError || !existingLease) {
        return createApiResponse(null, 'Lease not found');
      }

      // Update the lease
      const { data, error } = await supabase
        .from('RENT_leases')
        .update({
          tenant_id: leaseData.tenant_id,
          property_id: leaseData.property_id,
          lease_start_date: leaseData.lease_start_date,
          lease_end_date: leaseData.lease_end_date,
          rent: leaseData.rent,
          rent_cadence: leaseData.rent_cadence,
          move_in_fee: leaseData.move_in_fee,
          late_fee_amount: leaseData.late_fee_amount,
          status: leaseData.status,
          notes: leaseData.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', leaseData.id)
        .select(`
          *,
          tenant:RENT_tenants(id, first_name, last_name, email),
          property:RENT_properties(id, name, address, city, state)
        `)
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
   * Get paginated leases
   */
  static async getPaginated(
    page: number = 1,
    limit: number = 10,
    filters?: {
      tenant_id?: string;
      property_id?: string;
      status?: string;
    }
  ): Promise<ApiResponse<PaginatedResponse<Lease>>> {
    try {
      const supabase = getSupabaseClient();
      const offset = (page - 1) * limit;

      let query = supabase
        .from('RENT_leases')
        .select(`
          *,
          tenant:RENT_tenants(id, first_name, last_name, email),
          property:RENT_properties(id, name, address, city, state)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (filters?.tenant_id) {
        query = query.eq('tenant_id', filters.tenant_id);
      }

      if (filters?.property_id) {
        query = query.eq('property_id', filters.property_id);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data: leases, error, count } = await query;

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      return createApiResponse({
        data: leases as Lease[],
        total: count || 0,
        page,
        limit,
        hasMore: offset + limit < (count || 0)
      });
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Get active leases
   */
  static async getActive(): Promise<ApiResponse<Lease[]>> {
    return this.getAll({ status: 'active' });
  }

  /**
   * Get leases by tenant
   */
  static async getByTenant(tenantId: string): Promise<ApiResponse<Lease[]>> {
    return this.getAll({ tenant_id: tenantId });
  }

  /**
   * Get leases by property
   */
  static async getByProperty(propertyId: string): Promise<ApiResponse<Lease[]>> {
    return this.getAll({ property_id: propertyId });
  }

  /**
   * Get expiring leases (within 30 days)
   */
  static async getExpiringSoon(days: number = 30): Promise<ApiResponse<Lease[]>> {
    try {
      const supabase = getSupabaseClient();
      const today = new Date();
      const expiringDate = new Date();
      expiringDate.setDate(today.getDate() + days);

      const { data: leases, error } = await supabase
        .from('RENT_leases')
        .select(`
          *,
          tenant:RENT_tenants(id, first_name, last_name, email),
          property:RENT_properties(id, name, address, city, state)
        `)
        .eq('status', 'active')
        .gte('lease_end_date', today.toISOString().split('T')[0])
        .lte('lease_end_date', expiringDate.toISOString().split('T')[0])
        .order('lease_end_date', { ascending: true });

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      return createApiResponse(leases as Lease[]);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Update lease status based on end date
   */
  static async updateExpiredLeases(): Promise<ApiResponse<number>> {
    try {
      const supabase = getSupabaseClient();
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('RENT_leases')
        .update({ status: 'expired' })
        .eq('status', 'active')
        .lt('lease_end_date', today)
        .select('id');

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      return createApiResponse(data?.length || 0);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Search leases
   */
  static async search(searchTerm: string): Promise<ApiResponse<Lease[]>> {
    try {
      const supabase = getSupabaseClient();
      
      // Search by tenant name or property name/address
      const { data: leases, error } = await supabase
        .from('RENT_leases')
        .select(`
          *,
          tenant:RENT_tenants(id, first_name, last_name, email),
          property:RENT_properties(id, name, address, city, state)
        `)
        .or(`tenant.first_name.ilike.%${searchTerm}%,tenant.last_name.ilike.%${searchTerm}%,property.name.ilike.%${searchTerm}%,property.address.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      return createApiResponse(leases as Lease[]);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }
} 