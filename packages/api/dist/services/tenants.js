"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantsService = void 0;
const client_1 = require("../client");
class TenantsService {
    /**
     * Get all tenants with optional filtering
     */
    static async getAll(filters) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
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
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
            }
            // Fetch properties and leases separately
            const tenantsWithRelations = await Promise.all(tenants.map(async (tenant) => {
                // Fetch property
                let property = null;
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
                };
            }));
            return (0, client_1.createApiResponse)(tenantsWithRelations);
        }
        catch (error) {
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
    /**
     * Get a tenant by ID
     */
    static async getById(id) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            const { data: tenant, error } = await supabase
                .from('RENT_tenants')
                .select('*')
                .eq('id', id)
                .single();
            if (error) {
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
            }
            // Fetch property
            let property = null;
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
            };
            return (0, client_1.createApiResponse)(tenantWithRelations);
        }
        catch (error) {
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
    /**
     * Create a new tenant
     */
    static async create(tenantData) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            // Log the data being sent
            console.log('TenantsService.create - Input data:', tenantData);
            const { data, error } = await supabase
                .from('RENT_tenants')
                .insert([tenantData])
                .select('*')
                .single();
            if (error) {
                console.error('TenantsService.create - Supabase error:', error);
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
            }
            console.log('TenantsService.create - Success, created tenant:', data);
            // Return simple response without additional data for now
            return (0, client_1.createApiResponse)(data);
        }
        catch (error) {
            console.error('TenantsService.create - Unexpected error:', error);
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
    /**
     * Update an existing tenant
     */
    static async update(id, tenantData) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            const { data, error } = await supabase
                .from('RENT_tenants')
                .update(tenantData)
                .eq('id', id)
                .select('*')
                .single();
            if (error) {
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
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
                }
                else {
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
            let property = null;
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
            return (0, client_1.createApiResponse)(tenantWithRelations);
        }
        catch (error) {
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
    /**
     * Delete a tenant
     */
    static async delete(id) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            const { error } = await supabase
                .from('RENT_tenants')
                .delete()
                .eq('id', id);
            if (error) {
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
            }
            return (0, client_1.createApiResponse)(true);
        }
        catch (error) {
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
    /**
     * Get paginated tenants
     */
    static async getPaginated(page = 1, limit = 10, filters) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
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
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
            }
            // Fetch properties and leases separately
            const tenantsWithRelations = await Promise.all(tenants.map(async (tenant) => {
                // Fetch property
                let property = null;
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
            }));
            return (0, client_1.createApiResponse)({
                data: tenantsWithRelations,
                total: count || 0,
                page,
                limit,
                hasMore: offset + limit < (count || 0)
            });
        }
        catch (error) {
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
    /**
     * Search tenants
     */
    static async search(searchTerm) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            const { data: tenants, error } = await supabase
                .from('RENT_tenants')
                .select('*')
                .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
                .order('created_at', { ascending: false });
            if (error) {
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
            }
            // Fetch properties and leases separately
            const tenantsWithRelations = await Promise.all(tenants.map(async (tenant) => {
                // Fetch property
                let property = null;
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
            }));
            return (0, client_1.createApiResponse)(tenantsWithRelations);
        }
        catch (error) {
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
    /**
     * Get active tenants
     */
    static async getActive() {
        return this.getAll({ is_active: true });
    }
    /**
     * Get late tenants
     */
    static async getLate() {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            const { data: tenants, error } = await supabase
                .from('RENT_tenants')
                .select('*')
                .neq('late_status', 'on_time')
                .order('created_at', { ascending: false });
            if (error) {
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
            }
            // Fetch properties and leases separately
            const tenantsWithRelations = await Promise.all(tenants.map(async (tenant) => {
                // Fetch property
                let property = null;
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
            }));
            return (0, client_1.createApiResponse)(tenantsWithRelations);
        }
        catch (error) {
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
    /**
     * Get tenants by property
     */
    static async getByProperty(propertyId) {
        return this.getAll({ property_id: propertyId });
    }
    /**
     * Record a payment for a tenant using new pay period calculation
     */
    static async recordPayment(tenantId, paymentData) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            // First, get the current tenant with property information
            const { data: currentTenant, error: getError } = await supabase
                .from('RENT_tenants')
                .select('*')
                .eq('id', tenantId)
                .single();
            if (getError) {
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(getError));
            }
            if (!currentTenant) {
                return (0, client_1.createApiResponse)(null, 'Tenant not found');
            }
            // Fetch property data separately
            let property = null;
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
                    status: 'completed'
                }
            ];
            // Calculate new late payment status using the new system
            let newLateStatus = 'on_time';
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
                    }
                    else if (latePaymentInfo.latePeriods >= 2) {
                        newLateStatus = 'late_10_days';
                    }
                    else {
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
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
            }
            return (0, client_1.createApiResponse)(data);
        }
        catch (error) {
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
    /**
     * Get late tenants with detailed information using existing database structure
     */
    static async getLateTenants() {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            const { data: tenants, error } = await supabase
                .from('RENT_tenants')
                .select('*')
                .eq('is_active', true) // Only check active tenants
                .order('created_at', { ascending: false });
            if (error) {
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
            }
            // Fetch properties, leases, and payments for each tenant
            const tenantsWithRelations = await Promise.all(tenants.map(async (tenant) => {
                // Fetch property
                let property = null;
                if (tenant.property_id) {
                    const { data: propData } = await supabase
                        .from('RENT_properties')
                        .select('id, name, address, city, state, zip_code, property_type, monthly_rent, notes')
                        .eq('id', tenant.property_id)
                        .single();
                    property = propData;
                }
                // Fetch active leases
                const { data: leasesData } = await supabase
                    .from('RENT_leases')
                    .select('id, lease_start_date, lease_end_date, rent, rent_cadence, status')
                    .eq('tenant_id', tenant.id)
                    .eq('status', 'active')
                    .order('lease_start_date', { ascending: false });
                // Fetch actual payments from RENT_payments table
                const { data: paymentsData } = await supabase
                    .from('RENT_payments')
                    .select('id, amount, payment_date, payment_type')
                    .eq('tenant_id', tenant.id)
                    .order('payment_date', { ascending: false });
                return {
                    ...tenant,
                    properties: property,
                    leases: leasesData || [],
                    actualPayments: paymentsData || []
                };
            }));
            // Calculate late tenants using lease start dates and payments
            const lateTenants = [];
            for (const tenant of tenantsWithRelations) {
                if (!tenant.properties || !tenant.leases || tenant.leases.length === 0) {
                    continue;
                }
                const activeLease = tenant.leases[0];
                if (!activeLease.lease_start_date || !activeLease.rent) {
                    continue;
                }
                // Validate lease start date is not in the future
                const leaseStart = new Date(activeLease.lease_start_date);
                const today = new Date();
                if (leaseStart > today) {
                    continue;
                }
                // Validate rent amount is positive
                if (activeLease.rent <= 0) {
                    continue;
                }
                // Calculate based on lease start date and payments
                const daysSinceStart = Math.floor((today.getTime() - leaseStart.getTime()) / (1000 * 60 * 60 * 24));
                // Skip if lease started less than 7 days ago (too early to be late)
                if (daysSinceStart < 7) {
                    continue;
                }
                // Check for extremely old lease start dates (more than 10 years) that might indicate data issues
                if (daysSinceStart > 3650) {
                    continue;
                }
                // Calculate expected payments based on rent cadence
                const rentCadence = activeLease.rent_cadence || 'monthly';
                let expectedPayments = 0;
                let daysPerPeriod = 30;
                switch (rentCadence.toLowerCase().trim()) {
                    case 'weekly':
                        expectedPayments = Math.ceil(daysSinceStart / 7);
                        daysPerPeriod = 7;
                        break;
                    case 'bi-weekly':
                    case 'biweekly':
                    case 'bi_weekly':
                        expectedPayments = Math.ceil(daysSinceStart / 14);
                        daysPerPeriod = 14;
                        break;
                    case 'monthly':
                    default:
                        expectedPayments = Math.ceil(daysSinceStart / 30);
                        daysPerPeriod = 30;
                        break;
                }
                // Calculate total expected rent
                const totalExpectedRent = activeLease.rent * expectedPayments;
                // Calculate total payments received
                const totalPaymentsReceived = (tenant.actualPayments || []).reduce((sum, payment) => sum + payment.amount, 0);
                // More sophisticated check: analyze payment timing vs expected due dates
                let isActuallyLate = false;
                let totalDue = 0;
                let latePeriods = 0;
                let daysLate = 0;
                // Simple but effective check: if total payments < expected rent, tenant is late
                if (totalPaymentsReceived < totalExpectedRent) {
                    isActuallyLate = true;
                    totalDue = totalExpectedRent - totalPaymentsReceived;
                    // Calculate how many periods they're behind
                    const amountPerPeriod = activeLease.rent;
                    const periodsBehind = Math.ceil(totalDue / amountPerPeriod);
                    latePeriods = periodsBehind;
                    // Calculate days late based on when they should have made their last payment
                    if (expectedPayments > 0) {
                        // Calculate when the last expected payment should have been made
                        const lastExpectedPaymentDate = new Date(leaseStart);
                        lastExpectedPaymentDate.setDate(lastExpectedPaymentDate.getDate() + (daysPerPeriod * (expectedPayments - 1)));
                        // Add grace period (5 days)
                        const gracePeriodEnd = new Date(lastExpectedPaymentDate);
                        gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 5);
                        // Calculate days late from the grace period end
                        if (today > gracePeriodEnd) {
                            daysLate = Math.floor((today.getTime() - gracePeriodEnd.getTime()) / (1000 * 60 * 60 * 24));
                        }
                        else {
                            // If they're within grace period, calculate days since last expected payment
                            daysLate = Math.floor((today.getTime() - lastExpectedPaymentDate.getTime()) / (1000 * 60 * 60 * 24));
                            if (daysLate < 0)
                                daysLate = 0; // Don't show negative days
                        }
                    }
                }
                else {
                    // Even if they have enough total payments, check if they're paying on time
                    // This catches tenants who pay late but eventually catch up
                    const payments = (tenant.actualPayments || []).sort((a, b) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime());
                    if (payments.length > 0) {
                        // Check the most recent payment period
                        const lastPayment = payments[payments.length - 1];
                        const lastPaymentDate = new Date(lastPayment.payment_date);
                        // Calculate when the last expected payment should have been made
                        const lastExpectedPaymentDate = new Date(leaseStart);
                        lastExpectedPaymentDate.setDate(lastExpectedPaymentDate.getDate() + (daysPerPeriod * (expectedPayments - 1)));
                        // Add grace period (5 days)
                        const gracePeriodEnd = new Date(lastExpectedPaymentDate);
                        gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 5);
                        // If last payment was after grace period, tenant is late
                        if (lastPaymentDate > gracePeriodEnd) {
                            isActuallyLate = true;
                            totalDue = activeLease.rent; // They owe the current period
                            latePeriods = 1;
                            daysLate = Math.floor((today.getTime() - gracePeriodEnd.getTime()) / (1000 * 60 * 60 * 24));
                        }
                    }
                }
                if (isActuallyLate) {
                    // Calculate late fees
                    let lateFeePerPeriod = 0;
                    switch (rentCadence.toLowerCase().trim()) {
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
                    const totalLateFees = lateFeePerPeriod * latePeriods;
                    // Create proper LateTenant object
                    const lateTenant = {
                        ...tenant,
                        properties: tenant.properties,
                        total_due: totalDue,
                        total_late_fees: totalLateFees,
                        total_outstanding: totalDue,
                        late_periods: latePeriods,
                        days_late: Math.max(0, daysLate)
                    };
                    lateTenants.push(lateTenant);
                }
                else {
                    // Tenant is current
                }
            }
            return (0, client_1.createApiResponse)(lateTenants);
        }
        catch (error) {
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
    /**
     * Calculate total amount due for a tenant using new pay period logic
     */
    static calculateTotalDue(tenant) {
        if (!tenant.properties) {
            return (tenant.monthly_rent || 0) + (tenant.late_fees_owed || 0);
        }
        const latePaymentInfo = this.calculateTotalLatePayments(tenant, tenant.properties);
        return latePaymentInfo.totalDue;
    }
    /**
     * Calculate days late based on last payment date
     */
    static calculateDaysLate(lastPaymentDate) {
        if (!lastPaymentDate)
            return 0;
        const lastPayment = new Date(lastPaymentDate);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - lastPayment.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }
    /**
     * Calculate late periods based on days late and rent cadence
     */
    static calculateLatePeriods(tenant, daysLate) {
        if (!tenant.leases || tenant.leases.length === 0)
            return 0;
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
    static calculateLateFees(tenant, latePeriods) {
        if (!tenant.leases || tenant.leases.length === 0)
            return 0;
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
    static calculateTotalDueWithLateFees(tenant, lateFees) {
        const baseRent = tenant.leases && tenant.leases.length > 0
            ? tenant.leases[0].rent
            : tenant.monthly_rent || 0;
        return baseRent + lateFees;
    }
    /**
     * Calculate what a tenant actually owes using the currently_paid_up_date
     * This is the new improved calculation system
     */
    static calculateTenantOwedAmount(tenant) {
        if (!tenant.leases || tenant.leases.length === 0) {
            return {
                totalOwed: 0,
                totalLateFees: 0,
                missedPeriods: 0,
                missedPayments: []
            };
        }
        const activeLease = tenant.leases[0];
        const rentAmount = activeLease.rent || tenant.monthly_rent || 0;
        const rentCadence = activeLease.rent_cadence || 'monthly';
        // Use currently_paid_up_date if available, otherwise fall back to last_payment_date
        const paidUpDate = tenant.currently_paid_up_date
            ? new Date(tenant.currently_paid_up_date)
            : tenant.last_payment_date
                ? new Date(tenant.last_payment_date)
                : new Date(activeLease.lease_start_date);
        const today = new Date();
        let currentDate = new Date(paidUpDate);
        let totalOwed = 0;
        let totalLateFees = 0;
        let missedPeriods = 0;
        const missedPayments = [];
        // Calculate missed payments from paid up date to today
        while (currentDate <= today) {
            const dueDate = new Date(currentDate);
            const daysLate = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
            const isLate = daysLate > 5;
            const lateFee = isLate ? this.getLateFeeAmount(rentCadence) : 0;
            totalOwed += rentAmount + lateFee;
            totalLateFees += lateFee;
            missedPeriods++;
            missedPayments.push({
                dueDate,
                amount: rentAmount,
                isLate,
                lateFee
            });
            // Move to next payment date based on cadence
            switch (rentCadence.toLowerCase().trim()) {
                case 'weekly':
                    currentDate.setDate(currentDate.getDate() + 7);
                    break;
                case 'bi-weekly':
                case 'biweekly':
                case 'bi_weekly':
                    currentDate.setDate(currentDate.getDate() + 14);
                    break;
                case 'monthly':
                default:
                    currentDate.setMonth(currentDate.getMonth() + 1);
                    break;
            }
        }
        return {
            totalOwed,
            totalLateFees,
            missedPeriods,
            missedPayments
        };
    }
    /**
     * Calculate days late from the currently paid up date
     */
    static calculateDaysLateFromPaidUpDate(tenant) {
        if (!tenant.leases || tenant.leases.length === 0)
            return 0;
        const activeLease = tenant.leases[0];
        const rentCadence = activeLease.rent_cadence || 'monthly';
        // Use currently_paid_up_date if available, otherwise fall back to last_payment_date
        const paidUpDate = tenant.currently_paid_up_date
            ? new Date(tenant.currently_paid_up_date)
            : tenant.last_payment_date
                ? new Date(tenant.last_payment_date)
                : new Date(activeLease.lease_start_date);
        const today = new Date();
        let currentDate = new Date(paidUpDate);
        let totalDaysLate = 0;
        // Calculate total days late by summing up late days for each missed period
        while (currentDate <= today) {
            const dueDate = new Date(currentDate);
            const daysLate = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysLate > 5) {
                totalDaysLate += daysLate - 5; // Only count days beyond the 5-day grace period
            }
            // Move to next payment date based on cadence
            switch (rentCadence.toLowerCase().trim()) {
                case 'weekly':
                    currentDate.setDate(currentDate.getDate() + 7);
                    break;
                case 'bi-weekly':
                case 'biweekly':
                case 'bi_weekly':
                    currentDate.setDate(currentDate.getDate() + 14);
                    break;
                case 'monthly':
                default:
                    currentDate.setMonth(currentDate.getMonth() + 1);
                    break;
            }
        }
        return totalDaysLate;
    }
    /**
     * Get the late fee amount for a specific rent cadence
     */
    static getLateFeeAmount(cadence) {
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
    static extractRentCadence(notes) {
        if (!notes)
            return 'monthly';
        const cadenceMatch = notes.match(/Rent cadence:\s*(\w+)/i);
        return cadenceMatch ? cadenceMatch[1] : 'monthly';
    }
    /**
     * Calculate the number of days between two dates
     */
    static daysBetween(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffTime = Math.abs(d2.getTime() - d1.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    /**
     * Get the expected payment date for a specific pay period
     */
    static getExpectedPaymentDate(leaseStartDate, payPeriodIndex, cadence) {
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
    static getLastExpectedPaymentDates(leaseStartDate, cadence, count = 12) {
        const dates = [];
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
    static calculateLateFeesForPeriod(expectedDate, paymentHistory, cadence, rentAmount) {
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
    static calculateTotalLatePayments(tenant, property) {
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
            const periodResult = this.calculateLateFeesForPeriod(expectedDate, tenant.payment_history || [], cadence, rentAmount);
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
    static isTenantLate(tenant, property) {
        const latePaymentInfo = this.calculateTotalLatePayments(tenant, property);
        return latePaymentInfo.totalDue > 0;
    }
    /**
     * Create tenant by property address
     */
    static async createByPropertyAddress(tenantData) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            // First, find the property by address
            const { data: property, error: propertyError } = await supabase
                .from('RENT_properties')
                .select('id, monthly_rent')
                .ilike('address', `%${tenantData.property_address}%`)
                .single();
            if (propertyError) {
                return (0, client_1.createApiResponse)(null, `Property not found with address: ${tenantData.property_address}`);
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
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
            }
            return (0, client_1.createApiResponse)(data);
        }
        catch (error) {
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
    /**
     * Bulk create tenants by property address
     */
    static async bulkCreateByPropertyAddress(tenantsData) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            const created = [];
            const errors = [];
            for (const tenantData of tenantsData) {
                try {
                    const result = await this.createByPropertyAddress(tenantData);
                    if (result.success && result.data) {
                        created.push(result.data);
                    }
                    else {
                        errors.push(`Failed to create tenant ${tenantData.first_name} ${tenantData.last_name}: ${result.error}`);
                    }
                }
                catch (error) {
                    errors.push(`Error creating tenant ${tenantData.first_name} ${tenantData.last_name}: ${error}`);
                }
            }
            return (0, client_1.createApiResponse)({ created, errors });
        }
        catch (error) {
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
}
exports.TenantsService = TenantsService;
