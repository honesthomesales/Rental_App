import { getSupabaseClient, handleSupabaseError, createApiResponse } from '../client';
import type { Tenant, LateTenant, CreateTenantData, UpdateTenantData, ApiResponse, PaginatedResponse } from '../types';
import { PropertiesService } from './properties';

// Simple in-memory cache for tenants with shorter TTL for better performance
const tenantsCache = new Map<string, { data: Tenant[], timestamp: number }>();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for faster updates

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
      // Check cache first
      const cacheKey = JSON.stringify(filters || {});
      const cached = tenantsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return createApiResponse(cached.data);
      }

      const supabase = getSupabaseClient();
      
      // Use a more efficient query with joins to get all related data in one query
      let query = supabase
        .from('RENT_tenants')
        .select(`
          *,
          RENT_properties!RENT_tenants_property_id_fkey (
            id,
            name,
            address,
            notes,
            monthly_rent
          ),
          RENT_leases!RENT_leases_tenant_id_fkey (
            id,
            lease_start_date,
            lease_end_date,
            rent,
            rent_cadence,
            move_in_fee,
            status
          ),
          RENT_payments!RENT_payments_tenant_id_fkey (
            id,
            amount,
            payment_date,
            status,
            notes
          )
        `)
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

      const { data: tenantsWithRelations, error } = await query;

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      // Transform the data to match the expected format
      const tenants = (tenantsWithRelations as any[]).map(tenant => {
        // Transform payment history to match PaymentHistoryItem type
        const transformedPaymentHistory = (tenant.RENT_payments || []).map((payment: any) => ({
          date: payment.payment_date,
          amount: payment.amount,
          status: payment.status
        }));

        return {
          ...tenant,
          properties: tenant.RENT_properties,
          leases: tenant.RENT_leases || [],
          payment_history: transformedPaymentHistory
        } as Tenant;
      });

      // Cache the result
      tenantsCache.set(cacheKey, { data: tenants, timestamp: Date.now() });

      return createApiResponse(tenants);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Clear the tenants cache
   */
  static clearCache(): void {
    tenantsCache.clear();
  }

  /**
   * Get a tenant by ID
   */
  static async getById(id: string): Promise<ApiResponse<Tenant>> {
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

      // Fetch payment history from RENT_payments table
      const { data: paymentHistory } = await supabase
        .from('RENT_payments')
        .select('id, amount, payment_date, status, notes')
        .eq('tenant_id', tenant.id)
        .order('payment_date', { ascending: false });

      // Transform payment history to match PaymentHistoryItem type
      const transformedPaymentHistory = (paymentHistory || []).map(payment => ({
        date: payment.payment_date,
        amount: payment.amount,
        status: payment.status
      }));

      const tenantWithRelations = {
        ...tenant,
        properties: property,
        leases: leasesData || [],
        payment_history: transformedPaymentHistory
      } as Tenant;

      return createApiResponse(tenantWithRelations);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Create a new tenant
   */
  static async create(tenantData: CreateTenantData): Promise<ApiResponse<Tenant>> {
    try {
      const supabase = getSupabaseClient();
      
      // Extract only rent_cadence which doesn't belong in RENT_tenants table
      const { 
        rent_cadence,
        ...tenantInsertData 
      } = tenantData;
      
      // Clean up the data - convert empty strings to null for optional fields
      // Only include fields that actually exist in the RENT_tenants table
      const cleanedTenantData = {
        first_name: tenantInsertData.first_name,
        last_name: tenantInsertData.last_name,
        email: tenantInsertData.email || null,
        phone: tenantInsertData.phone || null,
        property_id: tenantInsertData.property_id || null,
        lease_start_date: tenantInsertData.lease_start_date ? new Date(tenantInsertData.lease_start_date).toISOString().split('T')[0] : null,
        lease_end_date: tenantInsertData.lease_end_date ? new Date(tenantInsertData.lease_end_date).toISOString().split('T')[0] : null,
        notes: tenantInsertData.notes || null
      };
      
      console.log('TenantsService.create - cleanedTenantData:', cleanedTenantData);
      
      const { data, error } = await supabase
        .from('RENT_tenants')
        .insert([cleanedTenantData])
        .select('*, RENT_properties(name, address)')
        .single();

      if (error) {
        console.error('TenantsService.create - Supabase error:', error);
        return createApiResponse(null, handleSupabaseError(error));
      }

      // Create lease if lease data is provided
      if (tenantData.property_id && rent_cadence) {
        const leaseData = {
          tenant_id: data.id,
          property_id: tenantData.property_id,
          lease_start_date: tenantData.lease_start_date || new Date().toISOString(),
          lease_end_date: tenantData.lease_end_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          rent: tenantData.monthly_rent || 0,
          rent_cadence: rent_cadence,
          move_in_fee: tenantData.security_deposit || 0,
          late_fee_amount: 50,
          status: 'active'
        };

        await supabase
          .from('RENT_leases')
          .insert([leaseData]);
      }

      // Fetch the complete tenant data with relations
      const { data: completeTenant } = await supabase
        .from('RENT_tenants')
        .select('*, RENT_properties(name, address)')
        .eq('id', data.id)
        .single();

      // Fetch leases
      const { data: leasesData } = await supabase
        .from('RENT_leases')
        .select('*')
        .eq('tenant_id', data.id)
        .order('lease_start_date', { ascending: false });

      const tenantWithRelations = {
        ...completeTenant,
        properties: completeTenant.RENT_properties,
        leases: leasesData || []
      };

      // Clear cache after creating new tenant
      this.clearCache();

      return createApiResponse(tenantWithRelations as Tenant);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Update an existing tenant
   */
  static async update(id: string, tenantData: UpdateTenantData): Promise<ApiResponse<Tenant>> {
    try {
      const supabase = getSupabaseClient();
      
      // Only include fields that exist in the RENT_tenants table
      const updateData = {
        first_name: tenantData.first_name,
        last_name: tenantData.last_name,
        email: tenantData.email || null,
        phone: tenantData.phone || null,
        emergency_contact_name: tenantData.emergency_contact_name || null,
        emergency_contact_phone: tenantData.emergency_contact_phone || null,
        notes: tenantData.notes || null
      };
      
      const { data, error } = await supabase
        .from('RENT_tenants')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      // Fetch leases
      const { data: leasesData } = await supabase
        .from('RENT_leases')
        .select('*')
        .eq('tenant_id', data.id)
        .order('lease_start_date', { ascending: false });

      const tenantWithRelations = {
        ...data,
        properties: null,
        leases: leasesData || []
      };

      // Clear cache after updating tenant
      this.clearCache();

      return createApiResponse(tenantWithRelations as Tenant);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Delete a tenant
   */
  static async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const supabase = getSupabaseClient();
      
      // Get the tenant first to know which property to update
      const { data: tenant, error: getError } = await supabase
        .from('RENT_tenants')
        .select('property_id')
        .eq('id', id)
        .single();

      if (getError) {
        return createApiResponse(null, handleSupabaseError(getError));
      }

      const propertyId = tenant?.property_id;

      // Delete the tenant
      const { error } = await supabase
        .from('RENT_tenants')
        .delete()
        .eq('id', id);

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      // Update property status if tenant had a property
      if (propertyId) {
        await PropertiesService.updatePropertyStatus(propertyId);
      }

      // Clear cache after deleting tenant
      this.clearCache();

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
  ): Promise<ApiResponse<PaginatedResponse<Tenant>>> {
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
        (tenants as Tenant[]).map(async (tenant) => {
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

          return {
            ...tenant,
            properties: property,
            leases: leasesData || []
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
  static async search(searchTerm: string): Promise<ApiResponse<Tenant[]>> {
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
        (tenants as Tenant[]).map(async (tenant) => {
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

          return {
            ...tenant,
            properties: property,
            leases: leasesData || []
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
  static async getActive(): Promise<ApiResponse<Tenant[]>> {
    return this.getAll({ is_active: true });
  }

  /**
   * Get late tenants
   */
  static async getLate(): Promise<ApiResponse<Tenant[]>> {
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
        (tenants as Tenant[]).map(async (tenant) => {
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

          return {
            ...tenant,
            properties: property,
            leases: leasesData || []
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
  static async getByProperty(propertyId: string): Promise<ApiResponse<Tenant[]>> {
    return this.getAll({ property_id: propertyId });
  }

  /**
   * Record a payment for a tenant using new pay period calculation
   */
  static async recordPayment(tenantId: string, paymentData: {
    amount: number;
    payment_date: string;
    description?: string;
    reference_number?: string;
  }): Promise<ApiResponse<Tenant>> {
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

      // Update payment history
      const updatedPaymentHistory = [
        ...currentTenant.payment_history,
        {
          date: paymentData.payment_date,
          amount: paymentData.amount,
          status: 'completed' as const
        }
      ];

      // Calculate new late payment status using the new system
      let newLateStatus: 'on_time' | 'late_5_days' | 'late_10_days' | 'eviction_notice' = 'on_time';
      let newLateFeesOwed = 0;

      if (property && currentTenant.lease_start_date) {
        const tenantWithUpdatedHistory = {
          ...currentTenant,
          payment_history: updatedPaymentHistory
        };
        
        const latePaymentInfo = this.calculateTotalLatePayments(tenantWithUpdatedHistory, property);
        
        if (latePaymentInfo.totalDue > 0) {
          newLateFeesOwed = latePaymentInfo.totalLateFees;
          // Determine late status based on total due and late periods
          if (latePaymentInfo.latePeriods >= 3) {
            newLateStatus = 'eviction_notice';
          } else if (latePaymentInfo.latePeriods >= 2) {
            newLateStatus = 'late_10_days';
          } else {
            newLateStatus = 'late_5_days';
          }
        }
      }

      // Update tenant with new payment history and calculated late status
      const { data, error } = await supabase
        .from('RENT_tenants')
        .update({
          payment_history: updatedPaymentHistory,
          last_payment_date: paymentData.payment_date,
          late_fees_owed: newLateFeesOwed,
          late_status: newLateStatus
        })
        .eq('id', tenantId)
        .select('*, RENT_properties(name, address, notes, monthly_rent)')
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
   * Get late tenants with detailed information using new pay period calculation
   */
  static async getLateTenants(): Promise<ApiResponse<LateTenant[]>> {
    try {
      const supabase = getSupabaseClient();
      const { data: tenants, error } = await supabase
        .from('RENT_tenants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      // Fetch properties, leases, and payment history separately
      const tenantsWithRelations = await Promise.all(
        (tenants as Tenant[]).map(async (tenant) => {
          // Fetch property
          let property: any = null;
          if (tenant.property_id) {
            const { data: propData } = await supabase
              .from('RENT_properties')
              .select('id, name, address, city, state, zip_code, property_type, monthly_rent, notes')
              .eq('id', tenant.property_id)
              .single();
            property = propData;
          }

                             // Fetch leases
                   const { data: leasesData } = await supabase
                     .from('RENT_leases')
                     .select('id, lease_start_date, lease_end_date, rent, rent_cadence, move_in_fee, status')
                     .eq('tenant_id', tenant.id)
                     .order('lease_start_date', { ascending: false });

                   // Fetch payment history from RENT_payments table
                   const { data: paymentHistory } = await supabase
                     .from('RENT_payments')
                     .select('id, amount, payment_date, status, notes')
                     .eq('tenant_id', tenant.id)
                     .order('payment_date', { ascending: false });

                   // Transform payment history to match PaymentHistoryItem type
                   const transformedPaymentHistory = (paymentHistory || []).map(payment => ({
                     date: payment.payment_date,
                     amount: payment.amount,
                     status: payment.status
                   }));

          return {
            ...tenant,
            properties: property,
            leases: leasesData || [],
            payment_history: transformedPaymentHistory
          } as Tenant;
        })
      );

      // Calculate late tenants using lease data and payment history
      const lateTenants = tenantsWithRelations.filter(tenant => {
        if (!tenant.properties || !tenant.leases || tenant.leases.length === 0) return false;
        return this.isTenantLate(tenant, tenant.properties);
      }).map(tenant => {
        const latePaymentInfo = this.calculateTotalLatePayments(tenant, tenant.properties);
        
        console.log(`Tenant ${tenant.first_name} ${tenant.last_name}:`, {
          totalDue: latePaymentInfo.totalDue,
          totalLateFees: latePaymentInfo.totalLateFees,
          totalOutstanding: latePaymentInfo.totalOutstanding,
          latePeriods: latePaymentInfo.latePeriods,
          paymentHistory: tenant.payment_history?.length || 0
        });
        
        return {
          ...tenant,
          total_due: latePaymentInfo.totalDue,
          total_late_fees: latePaymentInfo.totalLateFees,
          total_outstanding: latePaymentInfo.totalOutstanding,
          late_periods: latePaymentInfo.latePeriods,
          days_late: this.calculateDaysLate(tenant.last_payment_date)
        } as LateTenant;
      });

             // Sort by total amount owed (highest first)
       const sortedLateTenants = lateTenants.sort((a, b) => {
         return b.total_due - a.total_due;
       });

      return createApiResponse(sortedLateTenants);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Calculate total amount due for a tenant using new pay period logic
   */
  static calculateTotalDue(tenant: Tenant): number {
    if (!tenant.properties) {
      return (tenant.monthly_rent || 0) + (tenant.late_fees_owed || 0);
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
    
    const notesLower = notes.toLowerCase();
    
    // Check for specific format "Rent cadence: weekly"
    const cadenceMatch = notes.match(/Rent cadence:\s*(\w+)/i);
    if (cadenceMatch) {
      return cadenceMatch[1].toLowerCase();
    }
    
    // Check for cadence keywords in the notes
    if (notesLower.includes('weekly')) {
      return 'weekly';
    } else if (notesLower.includes('bi-weekly') || notesLower.includes('biweekly') || notesLower.includes('bi_weekly')) {
      return 'bi-weekly';
    } else if (notesLower.includes('monthly')) {
      return 'monthly';
    }
    
    return 'monthly';
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
  static getExpectedPaymentDate(leaseStartDate: string, payPeriodIndex: number, cadence: string, rentDueDay?: number): Date {
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
        if (rentDueDay && rentDueDay >= 1 && rentDueDay <= 31) {
          // Use the specified rent due day for monthly payments
          const result = new Date(startDate.getFullYear(), startDate.getMonth() + payPeriodIndex, rentDueDay);
          return result;
        } else {
          // Fallback to lease start date day of month
          const result = new Date(startDate);
          result.setMonth(result.getMonth() + payPeriodIndex);
          return result;
        }
    }
  }

  /**
   * Get the last N expected payment dates for a tenant starting from a specific period
   */
  static getLastExpectedPaymentDatesFromStart(leaseStartDate: string, cadence: string, count: number = 12, rentDueDay?: number, startPeriod: number = 0): Date[] {
    const dates: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find the most recent expected payment date that has actually occurred
    let currentPeriod = startPeriod;
    let currentDate = this.getExpectedPaymentDate(leaseStartDate, currentPeriod, cadence, rentDueDay);
    
    // Find the last period that has actually occurred (not future periods)
    while (currentDate <= today && currentPeriod < startPeriod + count * 2) {
      currentPeriod++;
      currentDate = this.getExpectedPaymentDate(leaseStartDate, currentPeriod, cadence, rentDueDay);
    }
    
    // Adjust to only include periods that have actually occurred
    const actualPeriods = Math.max(startPeriod, currentPeriod - 1); // Subtract 1 because we went one period too far
    
    // Get the last N periods, but don't exceed the actual number of periods that have occurred
    const periodsToInclude = Math.min(count, actualPeriods - startPeriod + 1);
    const endPeriod = actualPeriods;
    const beginPeriod = Math.max(startPeriod, endPeriod - periodsToInclude + 1);
    
    for (let i = beginPeriod; i <= endPeriod; i++) {
      dates.push(this.getExpectedPaymentDate(leaseStartDate, i, cadence, rentDueDay));
    }
    
    return dates;
  }

  /**
   * Get the last N expected payment dates for a tenant
   */
  static getLastExpectedPaymentDates(leaseStartDate: string, cadence: string, count: number = 12, rentDueDay?: number): Date[] {
    const dates: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find the most recent expected payment date that has actually occurred
    let currentPeriod = 0;
    let currentDate = this.getExpectedPaymentDate(leaseStartDate, currentPeriod, cadence, rentDueDay);
    
    // Find the last period that has actually occurred (not future periods)
    while (currentDate <= today && currentPeriod < count * 2) {
      currentPeriod++;
      currentDate = this.getExpectedPaymentDate(leaseStartDate, currentPeriod, cadence, rentDueDay);
    }
    
    // Adjust to only include periods that have actually occurred
    const actualPeriods = Math.max(0, currentPeriod - 1); // Subtract 1 because we went one period too far
    
    // Get the last N periods, but don't exceed the actual number of periods that have occurred
    const periodsToInclude = Math.min(count, actualPeriods);
    const startPeriod = Math.max(0, actualPeriods - periodsToInclude);
    
    for (let i = startPeriod; i < actualPeriods; i++) {
      dates.push(this.getExpectedPaymentDate(leaseStartDate, i, cadence, rentDueDay));
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
    rentAmount: number,
    rentDueDay?: number
  ): {
    isLate: boolean;
    daysLate: number;
    lateFees: number;
    totalPaid: number;
    outstanding: number;
  } {
    const lateFeeAmount = this.getLateFeeAmount(cadence);
    
    // Handle undefined payment history
    if (!paymentHistory || !Array.isArray(paymentHistory)) {
      paymentHistory = [];
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Use a more flexible payment matching approach based on cadence
    let periodStart: Date;
    let periodEnd: Date;
    let totalPaid = 0;
    
    const normalizedCadence = cadence.toLowerCase().trim();
    
    if (normalizedCadence === 'monthly') {
      // For monthly payments, check the entire month based on rent due day
      if (rentDueDay && rentDueDay >= 1 && rentDueDay <= 31) {
        // Use the specified rent due day to determine month boundaries
        const dueDate = new Date(expectedDate.getFullYear(), expectedDate.getMonth(), rentDueDay);
        
        // Period starts from the previous month's due date (or lease start if this is the first period)
        periodStart = new Date(dueDate);
        periodStart.setMonth(periodStart.getMonth() - 1);
        
        // Period ends on the current due date
        periodEnd = new Date(dueDate);
      } else {
        // Fallback to lease start date day of month
        periodStart = new Date(expectedDate.getFullYear(), expectedDate.getMonth(), 1);
        periodEnd = new Date(expectedDate.getFullYear(), expectedDate.getMonth() + 1, 0);
      }
      
      // Also check the previous month's end (last 7 days) for early payments
      const previousMonthEnd = new Date(periodStart);
      previousMonthEnd.setDate(previousMonthEnd.getDate() - 7);
      
      // Find payments for this month and previous month's end
      const periodPayments = paymentHistory.filter(payment => {
        const paymentDate = new Date(payment.date);
        paymentDate.setHours(0, 0, 0, 0);
        return (paymentDate >= periodStart && paymentDate <= periodEnd) || 
               (paymentDate >= previousMonthEnd && paymentDate < periodStart);
      });
      
      totalPaid = periodPayments.reduce((sum, payment) => sum + payment.amount, 0);
      
    } else if (normalizedCadence === 'bi-weekly' || normalizedCadence === 'biweekly' || normalizedCadence === 'bi_weekly') {
      // For bi-weekly payments, check a 14-day period starting from expected date
      periodStart = new Date(expectedDate);
      periodStart.setDate(periodStart.getDate() - 2); // Allow 2 days early
      periodEnd = new Date(expectedDate);
      periodEnd.setDate(periodEnd.getDate() + 12); // 12 days grace period
      
      const periodPayments = paymentHistory.filter(payment => {
        const paymentDate = new Date(payment.date);
        paymentDate.setHours(0, 0, 0, 0);
        return paymentDate >= periodStart && paymentDate <= periodEnd && payment.status === 'completed';
      });
      
      totalPaid = periodPayments.reduce((sum, payment) => sum + payment.amount, 0);
      
    } else {
      // For weekly payments, use a 7-day window
      periodStart = new Date(expectedDate);
      periodStart.setDate(periodStart.getDate() - 2); // Allow 2 days early
      periodEnd = new Date(expectedDate);
      periodEnd.setDate(periodEnd.getDate() + 5); // 5 days grace period
      
      const periodPayments = paymentHistory.filter(payment => {
        const paymentDate = new Date(payment.date);
        paymentDate.setHours(0, 0, 0, 0);
        return paymentDate >= periodStart && paymentDate <= periodEnd && payment.status === 'completed';
      });
      
      totalPaid = periodPayments.reduce((sum, payment) => sum + payment.amount, 0);
    }
    
    const outstanding = Math.max(0, rentAmount - totalPaid);
    
    // Check if payment is late (no payment within grace period and outstanding amount)
    const isLate = totalPaid < rentAmount && today > periodEnd && outstanding > 0;
    
    if (isLate) {
      // Payment is late - insufficient payment was made within the grace period
      const daysLate = this.daysBetween(periodEnd, today);
      
      // Calculate late fees based on outstanding amount and days late
      let lateFees = 0;
      if (outstanding > 0) {
        // Apply late fee for each period the payment is late
        const latePeriods = Math.ceil(daysLate / 30); // Monthly late fee periods
        lateFees = latePeriods * lateFeeAmount;
      }
      
      return {
        isLate: true,
        daysLate: Math.max(0, daysLate),
        lateFees,
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
   * Calculate total late payments for a tenant over the last 12 pay periods
   */
  static calculateTotalLatePayments(tenant: Tenant, property: any): {
    totalLateFees: number;
    totalOutstanding: number;
    totalDue: number;
    latePeriods: number;
    payPeriods: Array<{
      expectedDate: Date;
      isLate: boolean;
      daysLate: number;
      lateFees: number;
      totalPaid: number;
      outstanding: number;
    }>;
  } {
    console.log(`Calculating late payments for ${tenant.first_name} ${tenant.last_name}`);
    console.log('Property:', property);
    console.log('Leases:', tenant.leases);
    console.log('Payment history:', tenant.payment_history);
    
    if (!tenant.leases || tenant.leases.length === 0) {
      console.log('No leases found');
      return {
        totalLateFees: 0,
        totalOutstanding: 0,
        totalDue: 0,
        latePeriods: 0,
        payPeriods: []
      };
    }
    
    const activeLease = tenant.leases[0]; // Get the first (active) lease
    if (!activeLease.lease_start_date) {
      console.log('No lease start date');
      return {
        totalLateFees: 0,
        totalOutstanding: 0,
        totalDue: 0,
        latePeriods: 0,
        payPeriods: []
      };
    }
    
    // Get move-in fee from lease
    const moveInFee = activeLease.move_in_fee || 0;
    console.log(`Move-in fee: $${moveInFee}`);
    
    // Use property monthly rent and extract cadence from property notes (consistent with frontend)
    const monthlyRent = property?.monthly_rent || activeLease.rent || 0;
    const cadence = this.extractRentCadence(property?.notes) || activeLease.rent_cadence || 'monthly';
    
    // For monthly payments, use the monthly rent amount directly
    // For other cadences, we'll calculate the per-period amount
    let rentAmount = monthlyRent;
    if (cadence === 'weekly') {
      rentAmount = monthlyRent / 4.33; // Convert monthly to weekly
    } else if (cadence === 'bi-weekly' || cadence === 'biweekly' || cadence === 'bi_weekly') {
      rentAmount = monthlyRent / 2.17; // Convert monthly to bi-weekly
    }
    // For monthly, keep as is
    
    // Filter out move-in fee payments from payment history
    const filteredPaymentHistory = (tenant.payment_history || []).filter(payment => {
      // If the payment amount matches the move-in fee exactly, exclude it
      if (moveInFee > 0 && Math.abs(payment.amount - moveInFee) < 0.01) {
        console.log(`Excluding move-in fee payment: $${payment.amount} on ${payment.date}`);
        return false;
      }
      return true;
    });
    
    console.log(`Filtered payment history (excluding move-in fees):`, filteredPaymentHistory);
    
    // Calculate the first rent payment date (next cycle after lease start)
    const firstRentPaymentDate = this.getExpectedPaymentDate(activeLease.lease_start_date, 1, cadence, activeLease.rent_due_day);
    console.log(`First rent payment date: ${firstRentPaymentDate.toISOString().split('T')[0]}`);
    
    // Get expected payment dates starting from the first rent payment (period 1, not 0)
    const expectedDates = this.getLastExpectedPaymentDatesFromStart(
      activeLease.lease_start_date, 
      cadence, 
      12, 
      activeLease.rent_due_day,
      1 // Start from period 1 (next cycle after lease start)
    );
    
    console.log(`Expected dates for ${cadence} cadence (starting from first rent payment):`, expectedDates.map(d => d.toISOString().split('T')[0]));
    
    let totalLateFees = 0;
    let totalOutstanding = 0;
    let latePeriods = 0;
    let totalExpectedRent = 0;
    let totalPaid = 0;
    
    const payPeriods = expectedDates.map(expectedDate => {
      const periodResult = this.calculateLateFeesForPeriod(
        expectedDate,
        filteredPaymentHistory, // Use filtered payment history
        cadence,
        rentAmount,
        activeLease.rent_due_day
      );
      
      totalExpectedRent += rentAmount;
      totalPaid += periodResult.totalPaid;
      
      if (periodResult.isLate) {
        totalLateFees += periodResult.lateFees;
        totalOutstanding += periodResult.outstanding;
        latePeriods++;
      }
      
      return {
        expectedDate,
        ...periodResult
      };
    });
    
    // Ensure we're calculating the correct total due
    // Total due = Outstanding rent + Late fees (move-in fee is separate)
    const actualOutstanding = Math.max(0, totalExpectedRent - totalPaid);
    const finalTotalDue = actualOutstanding + totalLateFees;
    
    console.log(`Total expected rent: $${totalExpectedRent}, Total paid (excluding move-in): $${totalPaid}, Outstanding: $${actualOutstanding}, Late fees: $${totalLateFees}, Total due: $${finalTotalDue}`);
    
    return {
      totalLateFees,
      totalOutstanding: actualOutstanding,
      totalDue: finalTotalDue,
      latePeriods,
      payPeriods
    };
  }

  /**
   * Check if a tenant is currently late based on the new calculation system
   */
  static isTenantLate(tenant: Tenant, property: any): boolean {
    try {
      if (!tenant || !property) {
        return false;
      }
      
      const latePaymentInfo = this.calculateTotalLatePayments(tenant, property);
      return latePaymentInfo.totalDue > 0;
    } catch (error) {
      console.error('Error checking if tenant is late:', error);
      return false;
    }
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
  }): Promise<ApiResponse<Tenant>> {
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

      return createApiResponse(data as Tenant);
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
  }>): Promise<ApiResponse<{ created: Tenant[]; errors: string[] }>> {
    try {
      const supabase = getSupabaseClient();
      const created: Tenant[] = [];
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
} 