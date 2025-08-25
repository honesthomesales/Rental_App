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
            // Log the update data for debugging
            console.log('TenantsService.update - Updating tenant:', id, 'with data:', tenantData);
            // Filter out fields that don't exist in the RENT_tenants table
            const { monthly_rent, // Remove this since it's causing the error
            security_deposit, payment_history, late_fees_owed, late_status, last_payment_date, rent_cadence, ...filteredData } = tenantData;
            console.log('TenantsService.update - Filtered data:', filteredData);
            // Update the tenant
            const { data: updatedTenantData, error: tenantError } = await supabase
                .from('RENT_tenants')
                .update(filteredData)
                .eq('id', id)
                .select('*')
                .single();
            if (tenantError) {
                console.error('TenantsService.update - Supabase error:', tenantError);
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(tenantError));
            }
            // If monthly_rent was updated, also update the corresponding lease
            if (tenantData.monthly_rent !== undefined && tenantData.monthly_rent !== null) {
                try {
                    // Find the active lease for this tenant
                    const { data: leases, error: leaseError } = await supabase
                        .from('RENT_leases')
                        .select('*')
                        .eq('tenant_id', id)
                        .eq('status', 'active')
                        .order('created_at', { ascending: false })
                        .limit(1);
                    if (!leaseError && leases && leases.length > 0) {
                        const activeLease = leases[0];
                        console.log('TenantsService.update - Updating lease rent:', activeLease.id, 'to:', tenantData.monthly_rent);
                        // Update the lease rent
                        const { error: leaseUpdateError } = await supabase
                            .from('RENT_leases')
                            .update({ rent: tenantData.monthly_rent })
                            .eq('id', activeLease.id);
                        if (leaseUpdateError) {
                            console.warn('TenantsService.update - Failed to update lease rent:', leaseUpdateError);
                        }
                        else {
                            console.log('TenantsService.update - Successfully updated lease rent');
                        }
                    }
                    else {
                        // No active lease found, create one
                        console.log('TenantsService.update - No active lease found, creating new lease with rent:', tenantData.monthly_rent);
                        const { error: leaseCreateError } = await supabase
                            .from('RENT_leases')
                            .insert([{
                                tenant_id: id,
                                property_id: updatedTenantData.property_id,
                                rent: tenantData.monthly_rent,
                                rent_cadence: 'monthly',
                                status: 'active',
                                lease_start_date: updatedTenantData.lease_start_date || new Date().toISOString().split('T')[0],
                                lease_end_date: updatedTenantData.lease_end_date || '2030-12-31'
                            }]);
                        if (leaseCreateError) {
                            console.warn('TenantsService.update - Failed to create new lease:', leaseCreateError);
                        }
                        else {
                            console.log('TenantsService.update - Successfully created new lease');
                        }
                    }
                }
                catch (leaseUpdateError) {
                    console.warn('TenantsService.update - Error updating lease rent:', leaseUpdateError);
                }
            }
            // Fetch the updated tenant with leases using the same method as getById
            const { data: updatedTenant, error: fetchError } = await supabase
                .from('RENT_tenants')
                .select('*')
                .eq('id', id)
                .single();
            if (fetchError) {
                console.error('TenantsService.update - Error fetching updated tenant:', fetchError);
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(fetchError));
            }
            // Fetch property and leases separately (same as getById)
            let property = null;
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
            const tenantWithRelations = {
                ...updatedTenant,
                properties: property,
                leases: leasesData || []
            };
            return (0, client_1.createApiResponse)(tenantWithRelations);
        }
        catch (error) {
            console.error('TenantsService.update - Unexpected error:', error);
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
     * Record a payment for a tenant
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
            // TODO: Implement payment recording logic when database schema is updated
            // For now, just return the tenant as-is
            return (0, client_1.createApiResponse)(currentTenant);
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
            // TODO: Implement late tenant logic when database schema is updated
            // For now, return empty array
            return (0, client_1.createApiResponse)([]);
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
            // TODO: Implement total due calculation when database schema is updated
            return 0;
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
            : 0; // TODO: Implement base rent calculation when database schema is updated
        return baseRent + lateFees;
    }
    /**
     * Calculate what a tenant actually owes using the currently_paid_up_date
     * This is the new improved calculation system
     */
    static calculateTenantOwedAmount(tenant) {
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
    static calculateTotalDaysLate(tenant) {
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
     * Calculate total late payments for a tenant
     */
    static calculateTotalLatePayments(tenant, property) {
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
    static isTenantLate(tenant, property) {
        // TODO: Implement late payment check when database schema is updated
        return false;
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
    /**
     * Calculate total amount owed by a tenant
     */
    static calculateTotalAmountOwed(tenant) {
        // TODO: Implement total amount calculation when database schema is updated
        // For now, return 0 since these fields don't exist in the current schema
        return 0;
    }
    /**
     * Get the rent amount for a tenant
     */
    static getRentAmount(tenant) {
        // TODO: Implement rent amount calculation when database schema is updated
        // For now, return 0 since monthly_rent field doesn't exist in the current schema
        return 0;
    }
    /**
     * Calculate days since last payment
     */
    static calculateDaysSinceLastPayment(tenant) {
        // TODO: Implement days since last payment calculation when database schema is updated
        return 0;
    }
    /**
     * Calculate days since lease start
     */
    static calculateDaysSinceLeaseStart(tenant) {
        // TODO: Implement days since lease start calculation when database schema is updated
        return 0;
    }
}
exports.TenantsService = TenantsService;
