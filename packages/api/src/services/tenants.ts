import { getSupabaseClient, handleSupabaseError, createApiResponse } from '../client';
import type { Database } from '../database.types';
import type { Tenant as TenantType, PaymentHistoryItem, LateStatus } from '../types';

type TenantRow = Database['public']['Tables']['RENT_tenants']['Row'];
type TenantInsert = Database['public']['Tables']['RENT_tenants']['Insert'];
type TenantUpdate = Database['public']['Tables']['RENT_tenants']['Update'];
type PropertyRow = Database['public']['Tables']['RENT_properties']['Row'];
type LeaseRow = Database['public']['Tables']['RENT_leases']['Row'];
type PaymentRow = Database['public']['Tables']['RENT_payments']['Row'];

// Simple response types to avoid circular references
interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

// Remove the local Tenant interface and use the one from types.ts
// interface Tenant extends TenantRow {
//   properties?: PropertyRow;
//   leases?: any[];
// }

export class TenantsService {
  /**
   * Get all tenants with optional filtering
   */
  static async getAll(filters?: {
    property_id?: string;
    is_active?: boolean;
    late_status?: string;
  }): Promise<ApiResponse<TenantType[]>> {
    try {
      const supabase = getSupabaseClient();
      let query = supabase
        .from('RENT_tenants')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.property_id) {
        query = query.eq('property_id', filters.property_id);
      }

      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      if (filters?.late_status) {
        query = query.eq('late_status', filters.late_status);
      }

      const { data: tenants, error } = await query;

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      // Fetch properties and leases separately and map to expected Tenant type
      const tenantsWithRelations = await Promise.all(
        (tenants as TenantRow[]).map(async (tenant) => {
          // Fetch property
          let property: any = null;
          if (tenant.property_id) {
            const { data: propData } = await supabase
              .from('RENT_properties')
              .select('id, name, address, notes, monthly_rent')
              .eq('id', tenant.property_id)
              .single();
            property = propData;
          }

          // Fetch leases
          const { data: leasesData } = await supabase
            .from('RENT_leases')
            .select('*')
            .eq('tenant_id', tenant.id)
            .order('lease_start_date', { ascending: false });

          // Parse payment_history from JSONB
          let paymentHistory: PaymentHistoryItem[] = [];
          if (tenant.payment_history) {
            try {
              const rawPaymentHistory = tenant.payment_history;
              paymentHistory = Array.isArray(rawPaymentHistory) 
                ? rawPaymentHistory 
                : JSON.parse(rawPaymentHistory as string);
            } catch (e) {
              console.warn('Failed to parse payment_history for tenant:', tenant.id);
              paymentHistory = [];
            }
          }

          // Map to expected Tenant type
          const mappedTenant: TenantType = {
            id: tenant.id,
            property_id: tenant.property_id || undefined,
            first_name: tenant.first_name,
            last_name: tenant.last_name,
            email: tenant.email || undefined,
            phone: tenant.phone || undefined,
            emergency_contact_name: tenant.emergency_contact_name || undefined,
            emergency_contact_phone: tenant.emergency_contact_phone || undefined,
            lease_start_date: tenant.lease_start_date || undefined,
            lease_end_date: tenant.lease_end_date || undefined,
            monthly_rent: tenant.monthly_rent || undefined,
            security_deposit: tenant.security_deposit || undefined,
            lease_pdf_url: tenant.lease_pdf_url || undefined,
            payment_history: paymentHistory,
            late_fees_owed: tenant.late_fees_owed || 0,
            late_status: tenant.late_status || 'on_time',
            last_payment_date: tenant.last_payment_date || undefined,
            currently_paid_up_date: undefined, // This field doesn't exist in the database yet
            notes: tenant.notes || undefined,
            is_active: tenant.is_active || true,
            created_at: tenant.created_at,
            updated_at: tenant.updated_at,
            properties: property,
            payment_frequency: undefined, // This field doesn't exist in the database yet
            leases: (leasesData || []).map(lease => ({
              ...lease,
              tenant_id: lease.tenant_id || '',
              property_id: lease.property_id || '',
              rent_cadence: lease.rent_cadence || 'monthly'
            }))
          };

          return mappedTenant;
        })
      );

      return createApiResponse(tenantsWithRelations);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Get a tenant by ID
   */
  static async getById(id: string): Promise<ApiResponse<TenantType>> {
    try {
      const supabase = getSupabaseClient();
      const { data: tenant, error } = await supabase
        .from('RENT_tenants')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      // Fetch property
      let property: any = null;
      if (tenant.property_id) {
        const { data: propData } = await supabase
          .from('RENT_properties')
          .select('id, name, address, notes, monthly_rent')
          .eq('id', tenant.property_id)
          .single();
        property = propData;
      }

      // Fetch leases
      const { data: leasesData } = await supabase
        .from('RENT_leases')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('lease_start_date', { ascending: false });

      // Parse payment_history from JSONB
      let paymentHistory: PaymentHistoryItem[] = [];
      if (tenant.payment_history) {
        try {
          paymentHistory = Array.isArray(tenant.payment_history) 
            ? tenant.payment_history 
            : JSON.parse(tenant.payment_history as string);
        } catch (e) {
          console.warn('Failed to parse payment_history for tenant:', tenant.id);
          paymentHistory = [];
        }
      }

      const tenantWithRelations: TenantType = {
        ...tenant,
        properties: property,
        leases: leasesData || [],
        payment_history: paymentHistory
      };

      return createApiResponse(tenantWithRelations);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Create a new tenant
   */
  static async create(tenantData: TenantInsert): Promise<ApiResponse<TenantType>> {
    try {
      const supabase = getSupabaseClient();
      
      // Log the data being sent
      console.log('TenantsService.create - Input data:', tenantData);
      
      // Only send the columns that actually exist in the RENT_tenants table
      const insertData = {
        property_id: tenantData.property_id,
        first_name: tenantData.first_name,
        last_name: tenantData.last_name,
        email: tenantData.email,
        phone: tenantData.phone,
        // monthly_rent: (tenantData as any).monthly_rent, // Temporarily removed due to schema mismatch
        lease_start_date: tenantData.lease_start_date,
        lease_end_date: tenantData.lease_end_date,
        notes: tenantData.notes
      };
      
      console.log('TenantsService.create - Insert data (filtered):', insertData);
      
      const { data, error } = await supabase
        .from('RENT_tenants')
        .insert([insertData])
        .select('*')
        .single();

      if (error) {
        console.error('TenantsService.create - Supabase error:', error);
        return createApiResponse(null, handleSupabaseError(error));
      }

      console.log('TenantsService.create - Success, created tenant:', data);
      // Return simple response without additional data for now
      return createApiResponse(data as TenantType);
    } catch (error) {
      console.error('TenantsService.create - Unexpected error:', error);
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Update an existing tenant
   */
  static async update(id: string, tenantData: TenantUpdate): Promise<ApiResponse<TenantType>> {
    try {
      const supabase = getSupabaseClient()

      // Log the update data for debugging
      console.log('TenantsService.update - Updating tenant:', id, 'with data:', tenantData)

          // Filter out fields that don't exist in the RENT_tenants table
    const {
      monthly_rent, // Remove this since it's causing the error
      security_deposit,
      payment_history,
      late_fees_owed,
      late_status,
      last_payment_date,
      rent_cadence,
      ...filteredData
    } = tenantData as any;

    console.log('TenantsService.update - Filtered data:', filteredData)

      // Update the tenant
      const { data: updatedTenantData, error: tenantError } = await supabase
        .from('RENT_tenants')
        .update(filteredData)
        .eq('id', id)
        .select('*')
        .single()

      if (tenantError) {
        console.error('TenantsService.update - Supabase error:', tenantError)
        return createApiResponse(null, handleSupabaseError(tenantError))
      }

      // If monthly_rent was updated, also update the corresponding lease
      if ((tenantData as any).monthly_rent !== undefined && (tenantData as any).monthly_rent !== null) {
        try {
          // Find the active lease for this tenant
          const { data: leases, error: leaseError } = await supabase
            .from('RENT_leases')
            .select('*')
            .eq('tenant_id', id)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)

          if (!leaseError && leases && leases.length > 0) {
            const activeLease = leases[0]
            console.log('TenantsService.update - Updating lease rent:', activeLease.id, 'to:', (tenantData as any).monthly_rent)
            
            // Update the lease rent
            const { error: leaseUpdateError } = await supabase
              .from('RENT_leases')
              .update({ rent: (tenantData as any).monthly_rent })
              .eq('id', activeLease.id)

            if (leaseUpdateError) {
              console.warn('TenantsService.update - Failed to update lease rent:', leaseUpdateError)
            } else {
              console.log('TenantsService.update - Successfully updated lease rent')
            }
          } else {
            // No active lease found, create one
            console.log('TenantsService.update - No active lease found, creating new lease with rent:', (tenantData as any).monthly_rent)
            
            const { error: leaseCreateError } = await supabase
              .from('RENT_leases')
              .insert([{
                tenant_id: id,
                property_id: updatedTenantData.property_id,
                rent: (tenantData as any).monthly_rent,
                rent_cadence: 'monthly',
                status: 'active',
                lease_start_date: updatedTenantData.lease_start_date || new Date().toISOString().split('T')[0],
                lease_end_date: updatedTenantData.lease_end_date || '2030-12-31'
              }])

            if (leaseCreateError) {
              console.warn('TenantsService.update - Failed to create new lease:', leaseCreateError)
            } else {
              console.log('TenantsService.update - Successfully created new lease')
            }
          }
        } catch (leaseUpdateError) {
          console.warn('TenantsService.update - Error updating lease rent:', leaseUpdateError)
        }
      }

      // Fetch the updated tenant with leases using the same method as getById
      const { data: updatedTenant, error: fetchError } = await supabase
        .from('RENT_tenants')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) {
        console.error('TenantsService.update - Error fetching updated tenant:', fetchError)
        return createApiResponse(null, handleSupabaseError(fetchError))
      }

      // Fetch property and leases separately (same as getById)
      let property: any = null;
      if (updatedTenant.property_id) {
        const { data: propData } = await supabase
          .from('RENT_properties')
          .select('id, name, address, notes, monthly_rent')
          .eq('id', updatedTenant.property_id)
          .single();
        property = propData;
      }

      // Fetch leases
      const { data: leasesData } = await supabase
        .from('RENT_leases')
        .select('*')
        .eq('tenant_id', id)
        .order('lease_start_date', { ascending: false });

      // Parse payment_history from JSONB
      let paymentHistory: PaymentHistoryItem[] = [];
      if (updatedTenant.payment_history) {
        try {
          paymentHistory = Array.isArray(updatedTenant.payment_history) 
            ? updatedTenant.payment_history 
            : JSON.parse(updatedTenant.payment_history as string);
        } catch (e) {
          console.warn('Failed to parse payment_history for tenant:', updatedTenant.id);
          paymentHistory = [];
        }
      }

      const tenantWithRelations: TenantType = {
        ...updatedTenant,
        properties: property,
        leases: leasesData || [],
        payment_history: paymentHistory
      };

      return createApiResponse(tenantWithRelations)
    } catch (error) {
      console.error('TenantsService.update - Unexpected error:', error)
      return createApiResponse(null, handleSupabaseError(error))
    }
  }

  /**
   * Unlink tenant from property and update associated leases
   */
  static async unlinkTenantFromProperty(tenantId: string): Promise<ApiResponse<TenantType>> {
    try {
      const supabase = getSupabaseClient();
      console.log(`🔗 Unlinking tenant ${tenantId} from property...`);

      // First, get the tenant to find their current property_id
      const { data: tenant, error: tenantError } = await supabase
        .from('RENT_tenants')
        .select('*')
        .eq('id', tenantId)
        .single();

      if (tenantError || !tenant) {
        return createApiResponse(null, 'Tenant not found');
      }

      const currentPropertyId = tenant.property_id;
      if (!currentPropertyId) {
        return createApiResponse(null, 'Tenant is not currently linked to any property');
      }

      // Update all active leases for this tenant to mark them as inactive/expired
      const { error: leaseUpdateError } = await supabase
        .from('RENT_leases')
        .update({
          status: 'expired',
          lease_end_date: new Date().toISOString().split('T')[0] // Set end date to today
        })
        .eq('tenant_id', tenantId)
        .eq('status', 'active');

      if (leaseUpdateError) {
        console.error('Failed to update lease status:', leaseUpdateError);
        // Continue with tenant unlinking even if lease update fails
      }

      // Unlink tenant from property by setting property_id to null
      const { data: updatedTenant, error: unlinkError } = await supabase
        .from('RENT_tenants')
        .update({
          property_id: null,
          is_active: false // Also mark tenant as inactive
        })
        .eq('id', tenantId)
        .select()
        .single();

      if (unlinkError) {
        console.error('unlinkTenantFromProperty error', unlinkError);
        return createApiResponse(null, handleSupabaseError(unlinkError));
      }

      if (!updatedTenant) {
        console.warn(`Unlink updated 0 rows for tenant ${tenantId}. Possible RLS blocking UPDATE or tenant not found.`);
        return createApiResponse(null, 'Tenant unlink failed - no rows affected. This may be due to RLS policies.');
      }

      console.log(`✅ Tenant ${tenantId} successfully unlinked from property`);
      
      // Clear cache after unlinking tenant
      try {
        // Clear any cached data if needed
      } catch (cacheError) {
        console.error('Cache clear error:', cacheError);
      }

      return createApiResponse(updatedTenant as TenantType);
    } catch (error) {
      console.error('unlinkTenantFromProperty exception:', error);
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Delete a tenant
   */
  static async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('RENT_tenants')
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
   * Get paginated tenants
   */
  static async getPaginated(
    page: number = 1,
    limit: number = 10,
    filters?: {
      property_id?: string;
      is_active?: boolean;
      late_status?: string;
    }
  ): Promise<ApiResponse<{ data: TenantType[]; total: number; page: number; limit: number; hasMore: boolean }>> {
    try {
      const supabase = getSupabaseClient();
      const offset = (page - 1) * limit;

      let query = supabase
        .from('RENT_tenants')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (filters?.property_id) {
        query = query.eq('property_id', filters.property_id);
      }

      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      if (filters?.late_status) {
        query = query.eq('late_status', filters.late_status);
      }

      const { data: tenants, error, count } = await query;

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      // Fetch properties and leases separately
      const tenantsWithRelations = await Promise.all(
        (tenants as TenantRow[]).map(async (tenant) => {
          // Fetch property
          let property: any = null;
          if (tenant.property_id) {
            const { data: propData } = await supabase
              .from('RENT_properties')
              .select('id, name, address')
              .eq('id', tenant.property_id)
              .single();
            property = propData;
          }

          // Fetch leases
          const { data: leasesData } = await supabase
            .from('RENT_leases')
            .select('*')
            .eq('tenant_id', tenant.id)
            .order('lease_start_date', { ascending: false });

          // Parse payment_history from JSONB
          let paymentHistory: PaymentHistoryItem[] = [];
          if (tenant.payment_history) {
            try {
              paymentHistory = Array.isArray(tenant.payment_history) 
                ? tenant.payment_history 
                : JSON.parse(tenant.payment_history as string);
            } catch (e) {
              console.warn('Failed to parse payment_history for tenant:', tenant.id);
              paymentHistory = [];
            }
          }

          return {
            ...tenant,
            properties: property,
            leases: leasesData || [],
            payment_history: paymentHistory
          };
        })
      );

      return createApiResponse({
        data: tenantsWithRelations,
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
   * Search tenants
   */
  static async search(searchTerm: string): Promise<ApiResponse<TenantType[]>> {
    try {
      const supabase = getSupabaseClient();
      const { data: tenants, error } = await supabase
        .from('RENT_tenants')
        .select('*')
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      // Fetch properties and leases separately
      const tenantsWithRelations = await Promise.all(
        (tenants as TenantRow[]).map(async (tenant) => {
          // Fetch property
          let property: any = null;
          if (tenant.property_id) {
            const { data: propData } = await supabase
              .from('RENT_properties')
              .select('id, name, address')
              .eq('id', tenant.property_id)
              .single();
            property = propData;
          }

          // Fetch leases
          const { data: leasesData } = await supabase
            .from('RENT_leases')
            .select('*')
            .eq('tenant_id', tenant.id)
            .order('lease_start_date', { ascending: false });

          // Parse payment_history from JSONB
          let paymentHistory: PaymentHistoryItem[] = [];
          if (tenant.payment_history) {
            try {
              paymentHistory = Array.isArray(tenant.payment_history) 
                ? tenant.payment_history 
                : JSON.parse(tenant.payment_history as string);
            } catch (e) {
              console.warn('Failed to parse payment_history for tenant:', tenant.id);
              paymentHistory = [];
            }
          }

          return {
            ...tenant,
            properties: property,
            leases: leasesData || [],
            payment_history: paymentHistory
          };
        })
      );

      return createApiResponse(tenantsWithRelations);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Get active tenants
   */
  static async getActive(): Promise<ApiResponse<TenantType[]>> {
    return this.getAll({ is_active: true });
  }

  /**
   * Get late tenants
   */
  static async getLate(): Promise<ApiResponse<TenantType[]>> {
    try {
      const supabase = getSupabaseClient();
      const { data: tenants, error } = await supabase
        .from('RENT_tenants')
        .select('*')
        .neq('late_status', 'on_time')
        .order('created_at', { ascending: false });

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      // Fetch properties and leases separately
      const tenantsWithRelations = await Promise.all(
        (tenants as TenantRow[]).map(async (tenant) => {
          // Fetch property
          let property: any = null;
          if (tenant.property_id) {
            const { data: propData } = await supabase
              .from('RENT_properties')
              .select('id, name, address')
              .eq('id', tenant.property_id)
              .single();
            property = propData;
          }

          // Fetch leases
          const { data: leasesData } = await supabase
            .from('RENT_leases')
            .select('*')
            .eq('tenant_id', tenant.id)
            .order('lease_start_date', { ascending: false });

          // Parse payment_history from JSONB
          let paymentHistory: PaymentHistoryItem[] = [];
          if (tenant.payment_history) {
            try {
              paymentHistory = Array.isArray(tenant.payment_history) 
                ? tenant.payment_history 
                : JSON.parse(tenant.payment_history as string);
            } catch (e) {
              console.warn('Failed to parse payment_history for tenant:', tenant.id);
              paymentHistory = [];
            }
          }

          return {
            ...tenant,
            properties: property,
            leases: leasesData || [],
            payment_history: paymentHistory
          };
        })
      );

      return createApiResponse(tenantsWithRelations);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Get tenants by property
   */
  static async getByProperty(propertyId: string): Promise<ApiResponse<TenantType[]>> {
    return this.getAll({ property_id: propertyId });
  }

  /**
   * Record a payment for a tenant
   */
  static async recordPayment(
    tenantId: string,
    paymentData: {
      payment_date: string;
      amount: number;
    }
  ): Promise<ApiResponse<TenantType>> {
    try {
      const supabase = getSupabaseClient();
      
      // First, get the current tenant with property information
      const { data: currentTenant, error: getError } = await supabase
        .from('RENT_tenants')
        .select('*')
        .eq('id', tenantId)
        .single();

      if (getError) {
        return createApiResponse(null, handleSupabaseError(getError));
      }

      if (!currentTenant) {
        return createApiResponse(null, 'Tenant not found');
      }

      // Fetch property data separately
      let property: any = null;
      if (currentTenant.property_id) {
        const { data: propData } = await supabase
          .from('RENT_properties')
          .select('id, name, address, notes, monthly_rent')
          .eq('id', currentTenant.property_id)
          .single();
        property = propData;
      }

      // TODO: Implement payment recording logic when database schema is updated
      // For now, just return the tenant as-is
      return createApiResponse(currentTenant as TenantType);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Get late tenants with detailed information using existing database structure
   */
  static async getLateTenants(): Promise<ApiResponse<any[]>> { // Changed LateTenant to any[] as LateTenant type is removed
    try {
      const supabase = getSupabaseClient();
      const { data: tenants, error } = await supabase
        .from('RENT_tenants')
        .select('*')
        .eq('is_active', true) // Only check active tenants
        .order('created_at', { ascending: false });

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      // TODO: Implement late tenant logic when database schema is updated
      // For now, return empty array
      return createApiResponse([]);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Calculate total amount due for a tenant using new pay period logic
   */
  static calculateTotalDue(tenant: TenantType): number {
    if (!tenant.properties) {
      // TODO: Implement total due calculation when database schema is updated
      return 0;
    }
    
    const latePaymentInfo = this.calculateTotalLatePayments(tenant, tenant.properties);
    return latePaymentInfo.totalDue;
  }

  /**
   * Calculate days late based on last payment date
   */
  static calculateDaysLate(lastPaymentDate?: string): number {
    if (!lastPaymentDate) return 0;
    
    const lastPayment = new Date(lastPaymentDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastPayment.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

  /**
   * Calculate late periods based on days late and rent cadence
   */
  static calculateLatePeriods(tenant: TenantType, daysLate: number): number {
    if (!tenant.leases || tenant.leases.length === 0) return 0;
    
    const cadence = tenant.leases[0].rent_cadence || 'monthly';
    const normalizedCadence = cadence.toLowerCase().trim();
    
    switch (normalizedCadence) {
      case 'weekly':
        return Math.ceil(daysLate / 7);
      case 'bi-weekly':
      case 'biweekly':
      case 'bi_weekly':
        return Math.ceil(daysLate / 14);
      case 'monthly':
      default:
        return Math.ceil(daysLate / 30);
    }
  }

  /**
   * Calculate late fees based on late periods and rent cadence
   */
  static calculateLateFees(tenant: TenantType, latePeriods: number): number {
    if (!tenant.leases || tenant.leases.length === 0) return 0;
    
    const cadence = tenant.leases[0].rent_cadence || 'monthly';
    const normalizedCadence = cadence.toLowerCase().trim();
    
    let lateFeePerPeriod = 0;
    switch (normalizedCadence) {
      case 'weekly':
        lateFeePerPeriod = 10;
        break;
      case 'bi-weekly':
      case 'biweekly':
      case 'bi_weekly':
        lateFeePerPeriod = 20;
        break;
      case 'monthly':
      default:
        lateFeePerPeriod = 50;
        break;
    }
    
    return latePeriods * lateFeePerPeriod;
  }

  /**
   * Calculate total due including late fees
   */
  static calculateTotalDueWithLateFees(tenant: TenantType, lateFees: number): number {
    const baseRent = tenant.leases && tenant.leases.length > 0 
      ? tenant.leases[0].rent 
      : 0; // TODO: Implement base rent calculation when database schema is updated
    
    return baseRent + lateFees;
  }

  /**
   * Calculate what a tenant actually owes using the currently_paid_up_date
   * This is the new improved calculation system
   */
  static calculateTenantOwedAmount(tenant: TenantType): {
    totalOwed: number;
    totalLateFees: number;
    missedPeriods: number;
    missedPayments: Array<{
      dueDate: Date;
      amount: number;
      isLate: boolean;
      lateFee: number;
    }>;
  } {
    if (!tenant.leases || tenant.leases.length === 0) {
      // TODO: Implement calculation when database schema is updated
      return {
        totalOwed: 0,
        totalLateFees: 0,
        missedPeriods: 0,
        missedPayments: []
      };
    }
    
    const activeLease = tenant.leases[0];
    if (!activeLease.lease_start_date || !activeLease.rent) {
      return {
        totalOwed: 0,
        totalLateFees: 0,
        missedPeriods: 0,
        missedPayments: []
      };
    }

    // TODO: Implement full calculation when database schema is updated
    return {
      totalOwed: 0,
      totalLateFees: 0,
      missedPeriods: 0,
      missedPayments: []
    };
  }

  /**
   * Calculate total days late for a tenant
   */
  static calculateTotalDaysLate(tenant: TenantType): number {
    if (!tenant.leases || tenant.leases.length === 0) {
      return 0;
    }
    
    const activeLease = tenant.leases[0];
    if (!activeLease.lease_start_date || !activeLease.rent_cadence) {
      return 0;
    }
    
    const rentCadence = activeLease.rent_cadence;
    
    // TODO: Implement full calculation when database schema is updated
    // For now, return 0 since we don't have access to payment history
    return 0;
  }

  /**
   * Get the late fee amount for a specific rent cadence
   */
  static getLateFeeAmount(cadence: string): number {
    const normalizedCadence = cadence.toLowerCase().trim();
    
    switch (normalizedCadence) {
      case 'weekly':
        return 10;
      case 'bi-weekly':
      case 'biweekly':
      case 'bi_weekly':
        return 20;
      case 'monthly':
      default:
        return 45;
    }
  }

  /**
   * Extract rent cadence from property notes
   */
  static extractRentCadence(notes?: string): string {
    if (!notes) return 'monthly';
    
    const cadenceMatch = notes.match(/Rent cadence:\s*(\w+)/i);
    return cadenceMatch ? cadenceMatch[1] : 'monthly';
  }

  /**
   * Calculate the number of days between two dates
   */
  static daysBetween(date1: string | Date, date2: string | Date): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get the expected payment date for a specific pay period
   */
  static getExpectedPaymentDate(leaseStartDate: string, payPeriodIndex: number, cadence: string): Date {
    const startDate = new Date(leaseStartDate);
    const normalizedCadence = cadence.toLowerCase().trim();
    
    switch (normalizedCadence) {
      case 'weekly':
        return new Date(startDate.getTime() + (payPeriodIndex * 7 * 24 * 60 * 60 * 1000));
      case 'bi-weekly':
      case 'biweekly':
      case 'bi_weekly':
        return new Date(startDate.getTime() + (payPeriodIndex * 14 * 24 * 60 * 60 * 1000));
      case 'monthly':
      default:
        const result = new Date(startDate);
        result.setMonth(result.getMonth() + payPeriodIndex);
        return result;
    }
  }

  /**
   * Get the last N expected payment dates for a tenant
   */
  static getLastExpectedPaymentDates(leaseStartDate: string, cadence: string, count: number = 12): Date[] {
    const dates: Date[] = [];
    const today = new Date();
    
    // Find the most recent expected payment date
    let currentPeriod = 0;
    let currentDate = this.getExpectedPaymentDate(leaseStartDate, currentPeriod, cadence);
    
    while (currentDate <= today && currentPeriod < count * 2) {
      currentPeriod++;
      currentDate = this.getExpectedPaymentDate(leaseStartDate, currentPeriod, cadence);
    }
    
    // Get the last N periods
    for (let i = Math.max(0, currentPeriod - count); i < currentPeriod; i++) {
      dates.push(this.getExpectedPaymentDate(leaseStartDate, i, cadence));
    }
    
    return dates;
  }

  /**
   * Calculate late fees for a specific pay period
   */
  static calculateLateFeesForPeriod(
    expectedDate: Date, 
    paymentHistory: Array<{date: string, amount: number, status: string}>, 
    cadence: string,
    rentAmount: number
  ): {
    isLate: boolean;
    daysLate: number;
    lateFees: number;
    totalPaid: number;
    outstanding: number;
  } {
    const lateFeeAmount = this.getLateFeeAmount(cadence);
    
    // Find payments for this period (within 5 days of expected date)
    const periodStart = new Date(expectedDate);
    periodStart.setDate(periodStart.getDate() - 2); // Allow 2 days early
    
    const periodEnd = new Date(expectedDate);
    periodEnd.setDate(periodEnd.getDate() + 5); // 5 days grace period
    
    const periodPayments = paymentHistory.filter(payment => {
      const paymentDate = new Date(payment.date);
      return paymentDate >= periodStart && paymentDate <= periodEnd && payment.status === 'completed';
    });
    
    const totalPaid = periodPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const outstanding = Math.max(0, rentAmount - totalPaid);
    
    // Check if payment is late (after grace period)
    const lastPaymentDate = periodPayments.length > 0 
      ? new Date(Math.max(...periodPayments.map(p => new Date(p.date).getTime())))
      : null;
    
    if (!lastPaymentDate || lastPaymentDate > periodEnd) {
      // Payment is late
      const daysLate = lastPaymentDate 
        ? this.daysBetween(periodEnd, lastPaymentDate)
        : this.daysBetween(periodEnd, new Date());
      
      return {
        isLate: true,
        daysLate: Math.max(0, daysLate),
        lateFees: outstanding > 0 ? lateFeeAmount : 0,
        totalPaid,
        outstanding
      };
    }
    
    return {
      isLate: false,
      daysLate: 0,
      lateFees: 0,
      totalPaid,
      outstanding
    };
  }

  /**
   * Calculate total late payments for a tenant
   */
  static calculateTotalLatePayments(tenant: TenantType, property: any): {
    totalDue: number;
    totalLateFees: number;
    latePeriods: number;
  } {
    // TODO: Implement late payment calculation when database schema is updated
    return {
      totalDue: 0,
      totalLateFees: 0,
      latePeriods: 0
    };
  }

  /**
   * Check if a tenant is late on payments
   */
  static isTenantLate(tenant: TenantType, property: any): boolean {
    // TODO: Implement late payment check when database schema is updated
    return false;
  }

  /**
   * Create tenant by property address
   */
  static async createByPropertyAddress(tenantData: {
    property_address: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    lease_start_date?: string;
    lease_end_date?: string;
    monthly_rent?: number;
    security_deposit?: number;
    notes?: string;
  }): Promise<ApiResponse<TenantType>> {
    try {
      const supabase = getSupabaseClient();
      
      // First, find the property by address
      const { data: property, error: propertyError } = await supabase
        .from('RENT_properties')
        .select('id, monthly_rent')
        .ilike('address', `%${tenantData.property_address}%`)
        .single();

      if (propertyError) {
        return createApiResponse(null, `Property not found with address: ${tenantData.property_address}`);
      }

      // Create tenant with property_id
      const { property_address, ...tenantCreateData } = tenantData;
      const tenantDataWithProperty = {
        ...tenantCreateData,
        property_id: property.id,
        monthly_rent: tenantData.monthly_rent || property.monthly_rent
      };

      const { data, error } = await supabase
        .from('RENT_tenants')
        .insert([tenantDataWithProperty])
        .select('*, RENT_properties(name, address)')
        .single();

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      return createApiResponse(data as TenantType);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Bulk create tenants by property address
   */
  static async bulkCreateByPropertyAddress(tenantsData: Array<{
    property_address: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    lease_start_date?: string;
    lease_end_date?: string;
    monthly_rent?: number;
    security_deposit?: number;
    notes?: string;
  }>): Promise<ApiResponse<{ created: TenantType[]; errors: string[] }>> {
    try {
      const supabase = getSupabaseClient();
      const created: TenantType[] = [];
      const errors: string[] = [];

      for (const tenantData of tenantsData) {
        try {
          const result = await this.createByPropertyAddress(tenantData);
          if (result.success && result.data) {
            created.push(result.data);
          } else {
            errors.push(`Failed to create tenant ${tenantData.first_name} ${tenantData.last_name}: ${result.error}`);
          }
        } catch (error) {
          errors.push(`Error creating tenant ${tenantData.first_name} ${tenantData.last_name}: ${error}`);
        }
      }

      return createApiResponse({ created, errors });
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Calculate total amount owed by a tenant
   */
  static calculateTotalAmountOwed(tenant: TenantType): number {
    // TODO: Implement total amount calculation when database schema is updated
    // For now, return 0 since these fields don't exist in the current schema
    return 0;
  }

  /**
   * Get the rent amount for a tenant
   */
  static getRentAmount(tenant: TenantType): number {
    // TODO: Implement rent amount calculation when database schema is updated
    // For now, return 0 since monthly_rent field doesn't exist in the current schema
    return 0;
  }

  /**
   * Calculate days since last payment
   */
  static calculateDaysSinceLastPayment(tenant: TenantType): number {
    // TODO: Implement days since last payment calculation when database schema is updated
    return 0;
  }

  /**
   * Calculate days since lease start
   */
  static calculateDaysSinceLeaseStart(tenant: TenantType): number {
    // TODO: Implement days since lease start calculation when database schema is updated
    return 0;
  }
} 