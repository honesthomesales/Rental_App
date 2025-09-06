"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantsService = void 0;
const client_1 = require("../client");
const paymentAllocations_1 = require("./paymentAllocations");
const rentPeriods_1 = require("./rentPeriods");
// Remove the local Tenant interface and use the one from types.ts
// interface Tenant extends TenantRow {
//   properties?: PropertyRow;
//   leases?: any[];
// }
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
            // Fetch properties and leases separately and map to expected Tenant type
            const tenantsWithRelations = await Promise.all(tenants.map(async (tenant) => {
                // Fetch property
                let property = null;
                if (tenant.property_id) {
                    const { data: propData } = await supabase
                        .from('RENT_properties')
                        .select('id, name, address, notes')
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
                let paymentHistory = [];
                if (tenant.payment_history) {
                    try {
                        const rawPaymentHistory = tenant.payment_history;
                        paymentHistory = Array.isArray(rawPaymentHistory)
                            ? rawPaymentHistory
                            : JSON.parse(rawPaymentHistory);
                    }
                    catch (e) {
                        console.warn('Failed to parse payment_history for tenant:', tenant.id);
                        paymentHistory = [];
                    }
                }
                // Get active lease data to prioritize over tenant-level data
                const activeLease = (leasesData || []).find(lease => lease.status === 'active') || (leasesData || [])[0];
                // Map to expected Tenant type - prioritize lease data over tenant data
                const mappedTenant = {
                    id: tenant.id,
                    property_id: tenant.property_id || undefined,
                    first_name: tenant.first_name,
                    last_name: tenant.last_name,
                    email: tenant.email || undefined,
                    phone: tenant.phone || undefined,
                    emergency_contact_name: tenant.emergency_contact_name || undefined,
                    emergency_contact_phone: tenant.emergency_contact_phone || undefined,
                    // Prioritize lease data over tenant data for lease dates
                    lease_start_date: activeLease?.lease_start_date || tenant.lease_start_date || undefined,
                    lease_end_date: activeLease?.lease_end_date || tenant.lease_end_date || undefined,
                    security_deposit: tenant.security_deposit || undefined,
                    // Prioritize lease data for lease PDF URL
                    lease_pdf_url: activeLease?.lease_pdf_url || tenant.lease_pdf_url || undefined,
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
                    // Get payment frequency from active lease
                    payment_frequency: activeLease?.rent_cadence || undefined,
                    leases: (leasesData || []).map(lease => ({
                        ...lease,
                        tenant_id: lease.tenant_id || '',
                        property_id: lease.property_id || '',
                        rent_cadence: lease.rent_cadence || 'monthly',
                        rent_due_day: lease.rent_due_day || 1
                    }))
                };
                return mappedTenant;
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
                    .select('id, name, address, notes')
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
            let paymentHistory = [];
            if (tenant.payment_history) {
                try {
                    paymentHistory = Array.isArray(tenant.payment_history)
                        ? tenant.payment_history
                        : JSON.parse(tenant.payment_history);
                }
                catch (e) {
                    console.warn('Failed to parse payment_history for tenant:', tenant.id);
                    paymentHistory = [];
                }
            }
            // Get active lease data to prioritize over tenant-level data
            const activeLease = (leasesData || []).find(lease => lease.status === 'active') || (leasesData || [])[0];
            const tenantWithRelations = {
                ...tenant,
                // Prioritize lease data over tenant data for lease dates
                lease_start_date: activeLease?.lease_start_date || tenant.lease_start_date || undefined,
                lease_end_date: activeLease?.lease_end_date || tenant.lease_end_date || undefined,
                // Prioritize lease data for lease PDF URL
                lease_pdf_url: activeLease?.lease_pdf_url || tenant.lease_pdf_url || undefined,
                // Get payment frequency from active lease
                payment_frequency: activeLease?.rent_cadence || undefined,
                properties: property,
                leases: (leasesData || []).map(lease => ({
                    ...lease,
                    rent_due_day: lease.rent_due_day || 1
                })),
                payment_history: paymentHistory
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
            const { 
            // monthly_rent removed - rent data comes from RENT_leases
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
            // Note: monthly_rent field removed from tenants - rent data should come from RENT_leases
            // If rent data needs to be updated, it should be done through the lease update endpoint
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
                    .select('id, name, address, notes')
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
            let paymentHistory = [];
            if (updatedTenant.payment_history) {
                try {
                    paymentHistory = Array.isArray(updatedTenant.payment_history)
                        ? updatedTenant.payment_history
                        : JSON.parse(updatedTenant.payment_history);
                }
                catch (e) {
                    console.warn('Failed to parse payment_history for tenant:', updatedTenant.id);
                    paymentHistory = [];
                }
            }
            const tenantWithRelations = {
                ...updatedTenant,
                properties: property,
                leases: (leasesData || []).map(lease => ({
                    ...lease,
                    rent_due_day: 1 // Default value since database query doesn't include this field
                })),
                payment_history: paymentHistory
            };
            return (0, client_1.createApiResponse)(tenantWithRelations);
        }
        catch (error) {
            console.error('TenantsService.update - Unexpected error:', error);
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
    /**
     * Unlink tenant from property and update associated leases
     */
    static async unlinkTenantFromProperty(tenantId) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            console.log(`🔗 Unlinking tenant ${tenantId} from property...`);
            // First, get the tenant to find their current property_id
            const { data: tenant, error: tenantError } = await supabase
                .from('RENT_tenants')
                .select('*')
                .eq('id', tenantId)
                .single();
            if (tenantError || !tenant) {
                return (0, client_1.createApiResponse)(null, 'Tenant not found');
            }
            const currentPropertyId = tenant.property_id;
            if (!currentPropertyId) {
                return (0, client_1.createApiResponse)(null, 'Tenant is not currently linked to any property');
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
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(unlinkError));
            }
            if (!updatedTenant) {
                console.warn(`Unlink updated 0 rows for tenant ${tenantId}. Possible RLS blocking UPDATE or tenant not found.`);
                return (0, client_1.createApiResponse)(null, 'Tenant unlink failed - no rows affected. This may be due to RLS policies.');
            }
            console.log(`✅ Tenant ${tenantId} successfully unlinked from property`);
            // Clear cache after unlinking tenant
            try {
                // Clear any cached data if needed
            }
            catch (cacheError) {
                console.error('Cache clear error:', cacheError);
            }
            return (0, client_1.createApiResponse)(updatedTenant);
        }
        catch (error) {
            console.error('unlinkTenantFromProperty exception:', error);
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
                // Parse payment_history from JSONB
                let paymentHistory = [];
                if (tenant.payment_history) {
                    try {
                        paymentHistory = Array.isArray(tenant.payment_history)
                            ? tenant.payment_history
                            : JSON.parse(tenant.payment_history);
                    }
                    catch (e) {
                        console.warn('Failed to parse payment_history for tenant:', tenant.id);
                        paymentHistory = [];
                    }
                }
                return {
                    ...tenant,
                    properties: property,
                    leases: (leasesData || []).map(lease => ({
                        ...lease,
                        rent_due_day: 1 // Default value since database query doesn't include this field
                    })),
                    payment_history: paymentHistory
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
                // Parse payment_history from JSONB
                let paymentHistory = [];
                if (tenant.payment_history) {
                    try {
                        paymentHistory = Array.isArray(tenant.payment_history)
                            ? tenant.payment_history
                            : JSON.parse(tenant.payment_history);
                    }
                    catch (e) {
                        console.warn('Failed to parse payment_history for tenant:', tenant.id);
                        paymentHistory = [];
                    }
                }
                return {
                    ...tenant,
                    properties: property,
                    leases: (leasesData || []).map(lease => ({
                        ...lease,
                        rent_due_day: 1 // Default value since database query doesn't include this field
                    })),
                    payment_history: paymentHistory
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
                // Parse payment_history from JSONB
                let paymentHistory = [];
                if (tenant.payment_history) {
                    try {
                        paymentHistory = Array.isArray(tenant.payment_history)
                            ? tenant.payment_history
                            : JSON.parse(tenant.payment_history);
                    }
                    catch (e) {
                        console.warn('Failed to parse payment_history for tenant:', tenant.id);
                        paymentHistory = [];
                    }
                }
                return {
                    ...tenant,
                    properties: property,
                    leases: (leasesData || []).map(lease => ({
                        ...lease,
                        rent_due_day: 1 // Default value since database query doesn't include this field
                    })),
                    payment_history: paymentHistory
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
            if (!currentTenant.property_id) {
                return (0, client_1.createApiResponse)(null, 'Tenant is not linked to any property');
            }
            // Get the active lease for this tenant
            const { data: lease, error: leaseError } = await supabase
                .from('RENT_leases')
                .select('*')
                .eq('tenant_id', tenantId)
                .eq('status', 'active')
                .single();
            if (leaseError || !lease) {
                return (0, client_1.createApiResponse)(null, 'No active lease found for tenant');
            }
            // Create the payment record
            const { data: payment, error: paymentError } = await supabase
                .from('RENT_payments')
                .insert({
                property_id: currentTenant.property_id,
                tenant_id: tenantId,
                lease_id: lease.id,
                payment_date: paymentData.payment_date,
                amount: paymentData.amount,
                payment_type: 'rent',
                payment_method: 'manual',
                status: 'completed'
            })
                .select()
                .single();
            if (paymentError) {
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(paymentError));
            }
            // Ensure rent periods exist for this lease
            await rentPeriods_1.RentPeriodsService.generateRentPeriods(lease.id, tenantId, currentTenant.property_id, lease.lease_start_date, lease.lease_end_date, lease.rent, lease.rent_cadence || 'monthly', 1);
            // Allocate the payment across rent periods
            const allocationResult = await paymentAllocations_1.PaymentAllocationsService.allocatePayment(payment.id, tenantId, paymentData.amount, paymentData.payment_date);
            if (!allocationResult.success) {
                console.warn('Payment allocation had issues:', allocationResult.error);
            }
            // Update tenant's last payment date
            const { error: updateError } = await supabase
                .from('RENT_tenants')
                .update({
                last_payment_date: paymentData.payment_date,
                updated_at: new Date().toISOString()
            })
                .eq('id', tenantId);
            if (updateError) {
                console.warn('Failed to update tenant last payment date:', updateError);
            }
            // Return the updated tenant
            const { data: updatedTenant, error: fetchError } = await supabase
                .from('RENT_tenants')
                .select('*')
                .eq('id', tenantId)
                .single();
            if (fetchError) {
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(fetchError));
            }
            return (0, client_1.createApiResponse)(updatedTenant);
        }
        catch (error) {
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
    /**
     * Get late tenants with detailed information using the new rent period system
     */
    static async getLateTenants() {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            // Get all active tenants with their properties and leases
            const { data: tenants, error } = await supabase
                .from('RENT_tenants')
                .select(`
          *,
          RENT_properties!inner(
            id,
            name,
            address
          ),
          RENT_leases!inner(
            id,
            rent,
            rent_cadence,
            lease_start_date,
            lease_end_date,
            status
          )
        `)
                .eq('is_active', true)
                .eq('RENT_leases.status', 'active')
                .order('created_at', { ascending: false });
            if (error) {
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
            }
            if (!tenants || tenants.length === 0) {
                return (0, client_1.createApiResponse)([]);
            }
            // Process tenants to identify late payments using rent periods
            const lateTenants = await Promise.all(tenants.map(async (tenant) => {
                if (!tenant.RENT_properties || !tenant.RENT_leases || tenant.RENT_leases.length === 0) {
                    return null;
                }
                const property = tenant.RENT_properties;
                const lease = tenant.RENT_leases[0];
                // Get rent period summary for this tenant
                const periodSummary = await rentPeriods_1.RentPeriodsService.getTenantRentPeriodSummary(tenant.id);
                if (!periodSummary.success || !periodSummary.data) {
                    return null;
                }
                const summary = periodSummary.data;
                // Only include tenants who actually owe money
                if (summary.total_owed > 0) {
                    return {
                        ...tenant,
                        properties: property,
                        leases: [lease],
                        days_late: summary.overdue_periods > 0 ? 30 : 0, // Simplified for now
                        late_periods: summary.overdue_periods,
                        late_fees: summary.total_late_fees,
                        rent_amount: lease.rent || 0,
                        total_due: summary.total_owed,
                        late_status: summary.overdue_periods > 0 ? 'late_5_days' : 'on_time'
                    };
                }
                return null;
            }));
            const filteredLateTenants = lateTenants
                .filter((tenant) => tenant !== null)
                .sort((a, b) => (b?.total_due || 0) - (a?.total_due || 0)); // Sort by total due descending
            return (0, client_1.createApiResponse)(filteredLateTenants);
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
                .select('id')
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
                // monthly_rent removed - rent data comes from RENT_leases
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
