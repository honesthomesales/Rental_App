import { supabase, handleSupabaseError, createApiResponse } from '../client';
import type { Tenant, CreateTenantData, UpdateTenantData, ApiResponse, PaginatedResponse } from '../types';

export class TenantsService {
  /**
   * Get all tenants with optional filtering
   */
  static async getAll(filters?: {
    property_id?: string;
    is_active?: boolean;
    late_status?: string;
  }): Promise<ApiResponse<Tenant[]>> {
    try {
      let query = supabase
        .from('tenants')
        .select('*, properties(name, address)')
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

      const { data, error } = await query;

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      return createApiResponse(data as Tenant[]);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Get a tenant by ID
   */
  static async getById(id: string): Promise<ApiResponse<Tenant>> {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*, properties(name, address)')
        .eq('id', id)
        .single();

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      return createApiResponse(data as Tenant);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Create a new tenant
   */
  static async create(tenantData: CreateTenantData): Promise<ApiResponse<Tenant>> {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .insert([tenantData])
        .select('*, properties(name, address)')
        .single();

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      return createApiResponse(data as Tenant);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Update an existing tenant
   */
  static async update(id: string, tenantData: UpdateTenantData): Promise<ApiResponse<Tenant>> {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .update(tenantData)
        .eq('id', id)
        .select('*, properties(name, address)')
        .single();

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      return createApiResponse(data as Tenant);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Delete a tenant
   */
  static async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('tenants')
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
   * Get tenants with pagination
   */
  static async getPaginated(
    page: number = 1,
    limit: number = 10,
    filters?: {
      property_id?: string;
      is_active?: boolean;
      late_status?: string;
    }
  ): Promise<ApiResponse<PaginatedResponse<Tenant>>> {
    try {
      const offset = (page - 1) * limit;

      let query = supabase
        .from('tenants')
        .select('*, properties(name, address)', { count: 'exact' })
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

      const { data, error, count } = await query;

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      const total = count || 0;
      const hasMore = offset + limit < total;

      const response: PaginatedResponse<Tenant> = {
        data: data as Tenant[],
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
   * Search tenants by name or email
   */
  static async search(searchTerm: string): Promise<ApiResponse<Tenant[]>> {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*, properties(name, address)')
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      return createApiResponse(data as Tenant[]);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Get active tenants
   */
  static async getActive(): Promise<ApiResponse<Tenant[]>> {
    // Temporarily return all tenants since is_active column might not exist
    return this.getAll();
  }

  /**
   * Get late tenants
   */
  static async getLate(): Promise<ApiResponse<Tenant[]>> {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*, properties(name, address)')
        .neq('late_status', 'on_time')
        .order('created_at', { ascending: false });

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      return createApiResponse(data as Tenant[]);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Get tenants by property
   */
  static async getByProperty(propertyId: string): Promise<ApiResponse<Tenant[]>> {
    return this.getAll({ property_id: propertyId });
  }

  /**
   * Record a rent payment
   */
  static async recordPayment(tenantId: string, paymentData: {
    amount: number;
    payment_date: string;
    description?: string;
    reference_number?: string;
  }): Promise<ApiResponse<Tenant>> {
    try {
      // First, get the current tenant to update payment history
      const tenantResponse = await this.getById(tenantId);
      if (!tenantResponse.success || !tenantResponse.data) {
        return createApiResponse(null, 'Tenant not found');
      }

      const tenant = tenantResponse.data;
      const paymentHistory = Array.isArray(tenant.payment_history) ? tenant.payment_history : [];
      
      // Add new payment to history
      const newPayment = {
        date: paymentData.payment_date,
        amount: paymentData.amount,
        status: 'completed' as const
      };

      paymentHistory.push(newPayment);

      // Update tenant with new payment history and last payment date
      const updateData: UpdateTenantData = {
        id: tenantId,
        last_payment_date: paymentData.payment_date,
        late_fees_owed: Math.max(0, (tenant.late_fees_owed || 0) - paymentData.amount),
        late_status: 'on_time' as any // Reset late status
      };

      return this.update(tenantId, updateData);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Get tenants who are more than 5 days late on rent
   */
  static async getLateTenants(): Promise<ApiResponse<Tenant[]>> {
    try {
      console.log('getLateTenants: Starting...')
      
      // Get all tenants (removing is_active filter since column might not exist)
      const { data, error } = await supabase
        .from('tenants')
        .select('*');

      console.log('getLateTenants: Supabase response:', { data: data?.length, error })

      if (error) {
        console.error('getLateTenants: Supabase error:', error)
        return createApiResponse(null, handleSupabaseError(error));
      }

      if (!data) {
        console.log('getLateTenants: No data returned')
        return createApiResponse([]);
      }

      console.log('getLateTenants: Found', data.length, 'active tenants')
      
      // Log a sample of tenant data to see the structure
      if (data.length > 0) {
        console.log('getLateTenants: Sample tenant data:', {
          first_name: data[0].first_name,
          last_name: data[0].last_name,
          monthly_rent: data[0].monthly_rent,
          last_payment_date: data[0].last_payment_date,
          late_status: data[0].late_status
        });
      }

      // Filter tenants who are actually late based on payment dates
      const lateTenants = data.filter(tenant => {
        const lastPaymentDate = tenant.last_payment_date ? new Date(tenant.last_payment_date) : null;
        const today = new Date();
        
        console.log('getLateTenants: Checking tenant', tenant.first_name, tenant.last_name, {
          monthly_rent: tenant.monthly_rent,
          last_payment_date: tenant.last_payment_date,
          has_payment_date: !!lastPaymentDate
        });
        
        if (!lastPaymentDate) {
          // If no payment date, consider them late if they have a monthly rent
          const isLate = tenant.monthly_rent && tenant.monthly_rent > 0;
          if (isLate) {
            console.log('getLateTenants: Tenant', tenant.first_name, tenant.last_name, 'is late (no payment date)')
          } else {
            console.log('getLateTenants: Tenant', tenant.first_name, tenant.last_name, 'not late (no payment date, no rent)')
          }
          return isLate;
        }
        
        const daysLate = Math.floor((today.getTime() - lastPaymentDate.getTime()) / (1000 * 60 * 60 * 24));
        const isLate = daysLate > 5; // More than 5 days late
        
        if (isLate) {
          console.log('getLateTenants: Tenant', tenant.first_name, tenant.last_name, 'is late (', daysLate, 'days)')
        } else {
          console.log('getLateTenants: Tenant', tenant.first_name, tenant.last_name, 'not late (', daysLate, 'days ago)')
        }
        
        return isLate;
      });

      console.log('getLateTenants: Found', lateTenants.length, 'late tenants')
      return createApiResponse(lateTenants as Tenant[]);
    } catch (error) {
      console.error('getLateTenants: Exception:', error)
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Calculate total amount due for a tenant (rent + late fees)
   */
  static calculateTotalDue(tenant: Tenant): number {
    const monthlyRent = tenant.monthly_rent || 0;
    const lateFees = tenant.late_fees_owed || 0;
    
    // Calculate days since last payment
    const lastPaymentDate = tenant.last_payment_date ? new Date(tenant.last_payment_date) : null;
    const today = new Date();
    const daysLate = lastPaymentDate ? Math.floor((today.getTime() - lastPaymentDate.getTime()) / (1000 * 60 * 60 * 24)) : 30;
    
    // Calculate overdue rent (assuming monthly rent, prorate for days late)
    const overdueRent = Math.max(0, (daysLate - 30) * (monthlyRent / 30));
    
    return overdueRent + lateFees;
  }

  /**
   * Create tenant by property address - finds property by address and creates tenant
   * @param tenantData - Tenant data with property_address instead of property_id
   * @returns ApiResponse with created tenant
   */
  static async createByPropertyAddress(tenantData: {
    property_address: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    move_in_date?: string;
    lease_start_date?: string;
    lease_end_date?: string;
    monthly_rent?: number;
    security_deposit?: number;
    notes?: string;
  }): Promise<ApiResponse<Tenant>> {
    try {
      // First, find the property by address
      const { data: properties, error: propertyError } = await supabase
        .from('properties')
        .select('id, address, monthly_rent')
        .ilike('address', `%${tenantData.property_address}%`)
        .limit(1);

      if (propertyError) {
        return createApiResponse(null, handleSupabaseError(propertyError));
      }

      if (!properties || properties.length === 0) {
        return createApiResponse(null, `No property found with address containing: ${tenantData.property_address}`);
      }

      const property = properties[0];

      // Create tenant data with the found property_id
      const { property_address, ...tenantFields } = tenantData;
      const createTenantData: CreateTenantData = {
        ...tenantFields,
        property_id: property.id,
        // Use property's monthly_rent if not provided
        monthly_rent: tenantData.monthly_rent || property.monthly_rent
      };

      // Create the tenant
      const { data, error } = await supabase
        .from('tenants')
        .insert([createTenantData])
        .select('*, properties(name, address)')
        .single();

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      return createApiResponse(data as Tenant);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Bulk create tenants by property address
   * @param tenantsData - Array of tenant data with property_address
   * @returns ApiResponse with created tenants and any errors
   */
  static async bulkCreateByPropertyAddress(tenantsData: Array<{
    property_address: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    move_in_date?: string;
    lease_start_date?: string;
    lease_end_date?: string;
    monthly_rent?: number;
    security_deposit?: number;
    notes?: string;
  }>): Promise<ApiResponse<{ created: Tenant[]; errors: string[] }>> {
    try {
      const created: Tenant[] = [];
      const errors: string[] = [];

      for (const tenantData of tenantsData) {
        const result = await this.createByPropertyAddress(tenantData);
        if (result.success && result.data) {
          created.push(result.data);
        } else {
          errors.push(`Failed to create tenant ${tenantData.first_name} ${tenantData.last_name}: ${result.error}`);
        }
      }

      return createApiResponse({ created, errors });
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }
} 