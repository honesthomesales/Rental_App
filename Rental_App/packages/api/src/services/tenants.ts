import { getSupabaseClient, handleSupabaseError, createApiResponse } from '../client';
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

      // Fetch properties and leases separately
      const tenantsWithRelations = await Promise.all(
        (tenants as Tenant[]).map(async (tenant) => {
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

          return {
            ...tenant,
            properties: property,
            leases: leasesData || []
          } as Tenant;
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

      const tenantWithRelations = {
        ...tenant,
        properties: property,
        leases: leasesData || []
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
      const { data, error } = await supabase
        .from('RENT_tenants')
        .insert([tenantData])
        .select('*')
        .single();

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      // Create lease if rent_cadence is provided
      if (tenantData.rent_cadence && data.property_id) {
        const leaseData = {
          tenant_id: data.id,
          property_id: data.property_id,
          lease_start_date: tenantData.lease_start_date || new Date().toISOString(),
          lease_end_date: tenantData.lease_end_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          rent: tenantData.monthly_rent || 0,
          rent_cadence: tenantData.rent_cadence,
          move_in_fee: 0,
          late_fee_amount: 50,
          status: 'active'
        };

        await supabase
          .from('RENT_leases')
          .insert([leaseData]);
      }

      // Fetch property data separately
      let property: any = null;
      if (data.property_id) {
        const { data: propData } = await supabase
          .from('RENT_properties')
          .select('id, name, address, notes, monthly_rent')
          .eq('id', data.property_id)
          .single();
        property = propData;
      }

      // Fetch leases
      const { data: leasesData } = await supabase
        .from('RENT_leases')
        .select('*')
        .eq('tenant_id', data.id)
        .order('lease_start_date', { ascending: false });

      const tenantWithRelations = {
        ...data,
        properties: property,
        leases: leasesData || []
      };

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
      const { data, error } = await supabase
        .from('RENT_tenants')
        .update(tenantData)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      // Update lease if rent_cadence is provided
      if (tenantData.rent_cadence && data.property_id) {
        // Check if lease exists
        const { data: existingLease } = await supabase
          .from('RENT_leases')
          .select('id, lease_start_date, lease_end_date')
          .eq('tenant_id', data.id)
          .eq('status', 'active')
          .single();

        if (existingLease) {
          // Update existing lease
          await supabase
            .from('RENT_leases')
            .update({
              rent_cadence: tenantData.rent_cadence,
              rent: tenantData.monthly_rent || 0,
              lease_start_date: tenantData.lease_start_date || existingLease.lease_start_date,
              lease_end_date: tenantData.lease_end_date || existingLease.lease_end_date
            })
            .eq('id', existingLease.id);
        } else {
          // Create new lease
          const leaseData = {
            tenant_id: data.id,
            property_id: data.property_id,
            lease_start_date: tenantData.lease_start_date || new Date().toISOString(),
            lease_end_date: tenantData.lease_end_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            rent: tenantData.monthly_rent || 0,
            rent_cadence: tenantData.rent_cadence,
            move_in_fee: 0,
            late_fee_amount: 50,
            status: 'active'
          };

          await supabase
            .from('RENT_leases')
            .insert([leaseData]);
        }
      }

      // Fetch property data separately
      let property: any = null;
      if (data.property_id) {
        const { data: propData } = await supabase
          .from('RENT_properties')
          .select('id, name, address, notes, monthly_rent')
          .eq('id', data.property_id)
          .single();
        property = propData;
      }

      // Fetch leases
      const { data: leasesData } = await supabase
        .from('RENT_leases')
        .select('*')
        .eq('tenant_id', data.id)
        .order('lease_start_date', { ascending: false });

      const tenantWithRelations = {
        ...data,
        properties: property,
        leases: leasesData || []
      };

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
  static async getLateTenants(): Promise<ApiResponse<Tenant[]>> {
    try {
      const supabase = getSupabaseClient();
          const { data: tenants, error } = await supabase
              .from('RENT_tenants')
      .select('*')
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
              .select('id, name, address, city, state, zip_code, property_type, monthly_rent, notes')
              .eq('id', tenant.property_id)
              .single();
            property = propData;
          }

          // Fetch leases
          const { data: leasesData } = await supabase
            .from('RENT_leases')
            .select('id, lease_start_date, lease_end_date, rent, rent_cadence, status')
            .eq('tenant_id', tenant.id)
            .order('lease_start_date', { ascending: false });

          return {
            ...tenant,
            properties: property,
            leases: leasesData || []
          } as Tenant;
        })
      );

      // Calculate late tenants using lease data and payment history
      const lateTenants = tenantsWithRelations.filter(tenant => {
        if (!tenant.properties || !tenant.leases || tenant.leases.length === 0) return false;
        return this.isTenantLate(tenant, tenant.properties);
      }).map(tenant => {
        const latePaymentInfo = this.calculateTotalLatePayments(tenant, tenant.properties);
        
        return {
          ...tenant,
          total_due: latePaymentInfo.totalDue,
          total_late_fees: latePaymentInfo.totalLateFees,
          total_outstanding: latePaymentInfo.totalOutstanding,
          late_periods: latePaymentInfo.latePeriods,
          days_late: this.calculateDaysLate(tenant.last_payment_date)
        };
      });

      return createApiResponse(lateTenants);
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
    if (!tenant.leases || tenant.leases.length === 0) {
      return {
        totalLateFees: 0,
        totalOutstanding: 0,
        totalDue: 0,
        latePeriods: 0,
        payPeriods: []
      };
    }
    
    const activeLease = tenant.leases[0]; // Get the first (active) lease
    if (!activeLease.lease_start_date || !activeLease.rent) {
      return {
        totalLateFees: 0,
        totalOutstanding: 0,
        totalDue: 0,
        latePeriods: 0,
        payPeriods: []
      };
    }
    
    const cadence = activeLease.rent_cadence || 'monthly';
    const rentAmount = activeLease.rent;
    const expectedDates = this.getLastExpectedPaymentDates(activeLease.lease_start_date, cadence, 12);
    
    let totalLateFees = 0;
    let totalOutstanding = 0;
    let latePeriods = 0;
    
    const payPeriods = expectedDates.map(expectedDate => {
      const periodResult = this.calculateLateFeesForPeriod(
        expectedDate,
        tenant.payment_history || [],
        cadence,
        rentAmount
      );
      
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
    
    return {
      totalLateFees,
      totalOutstanding,
      totalDue: totalLateFees + totalOutstanding,
      latePeriods,
      payPeriods
    };
  }

  /**
   * Check if a tenant is currently late based on the new calculation system
   */
  static isTenantLate(tenant: Tenant, property: any): boolean {
    const latePaymentInfo = this.calculateTotalLatePayments(tenant, property);
    return latePaymentInfo.totalDue > 0;
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