"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const client_1 = require("../client");
class PaymentsService {
    /**
     * Get all payments
     */
    static async getAll() {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            const { data, error } = await supabase
                .from('RENT_payments')
                .select('*')
                .order('created_at', { ascending: false });
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
     * Get payments by date range for efficient loading
     */
    static async getByDateRange(startDate, endDate) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            const { data, error } = await supabase
                .from('RENT_payments')
                .select('*')
                .gte('payment_date', startDate)
                .lte('payment_date', endDate)
                .order('payment_date', { ascending: false });
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
     * Get the most recent month that has payments
     */
    static async getMostRecentMonthWithPayments() {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            const { data, error } = await supabase
                .from('RENT_payments')
                .select('payment_date')
                .order('payment_date', { ascending: false })
                .limit(1);
            if (error) {
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
            }
            if (!data || data.length === 0) {
                // If no payments exist, return current month
                const now = new Date();
                return (0, client_1.createApiResponse)({ year: now.getFullYear(), month: now.getMonth() });
            }
            const mostRecentPayment = data[0];
            const paymentDate = new Date(mostRecentPayment.payment_date);
            return (0, client_1.createApiResponse)({
                year: paymentDate.getFullYear(),
                month: paymentDate.getMonth()
            });
        }
        catch (error) {
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
    /**
     * Get properties with their active tenants for the payments grid
     */
    static async getPropertiesWithTenants() {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            // Get all properties
            const { data: properties, error: propertiesError } = await supabase
                .from('RENT_properties')
                .select('id, name, address, city, state, notes')
                .order('name');
            if (propertiesError) {
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(propertiesError));
            }
            // Get all tenants
            const { data: tenants, error: tenantsError } = await supabase
                .from('RENT_tenants')
                .select('id, first_name, last_name, property_id')
                .eq('is_active', true);
            if (tenantsError) {
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(tenantsError));
            }
            // Get all leases
            const { data: leases, error: leasesError } = await supabase
                .from('RENT_leases')
                .select('id, tenant_id, rent_cadence, rent, lease_start_date, lease_end_date, status')
                .eq('status', 'active');
            if (leasesError) {
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(leasesError));
            }
            // Combine the data
            const propertiesWithData = (properties || []).map(property => {
                const propertyTenants = (tenants || []).filter(tenant => tenant.property_id === property.id);
                const propertyLeases = (leases || []).filter(lease => propertyTenants.some(tenant => tenant.id === lease.tenant_id));
                return {
                    ...property,
                    tenants: propertyTenants,
                    leases: propertyLeases
                };
            });
            return (0, client_1.createApiResponse)(propertiesWithData);
        }
        catch (error) {
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
    /**
     * Create a payment
     */
    static async createPayment(paymentData) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            // Create the payment record
            const { data, error } = await supabase
                .from('RENT_payments')
                .insert([{
                    payment_date: paymentData.payment_date,
                    amount: paymentData.amount,
                    property_id: paymentData.property_id,
                    tenant_id: paymentData.tenant_id,
                    payment_type: paymentData.payment_type,
                    notes: paymentData.notes
                }])
                .select()
                .single();
            if (error) {
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
            }
            // If this is a rent payment, automatically allocate it to rent periods
            if (paymentData.payment_type?.toLowerCase() === 'rent' && data?.id) {
                try {
                    console.log('Auto-allocating rent payment to periods:', data.id);
                    // Call the RPC function to automatically allocate the payment
                    const { error: allocationError } = await supabase.rpc('RENT_apply_payment', {
                        payment_id: data.id
                    });
                    if (allocationError) {
                        console.error('Error auto-allocating payment:', allocationError);
                        // Don't fail the payment creation if allocation fails
                        // The payment is still created, just not allocated
                    }
                    else {
                        console.log('Payment successfully auto-allocated to rent periods');
                    }
                }
                catch (allocationError) {
                    console.error('Error in auto-allocation process:', allocationError);
                    // Don't fail the payment creation if allocation fails
                }
            }
            return (0, client_1.createApiResponse)(data);
        }
        catch (error) {
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
    /**
     * Update a payment
     */
    static async updatePayment(paymentId, updateData) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            // Update the payment record
            const { data, error } = await supabase
                .from('RENT_payments')
                .update(updateData)
                .eq('id', paymentId)
                .select()
                .single();
            if (error) {
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
            }
            // If this is a rent payment and amount was changed, re-allocate it
            if (data?.payment_type?.toLowerCase() === 'rent' && updateData.amount !== undefined) {
                try {
                    console.log('Re-allocating updated rent payment to periods:', paymentId);
                    // Call the RPC function to re-allocate the payment
                    const { error: allocationError } = await supabase.rpc('RENT_apply_payment', {
                        payment_id: paymentId
                    });
                    if (allocationError) {
                        console.error('Error re-allocating payment:', allocationError);
                        // Don't fail the payment update if allocation fails
                    }
                    else {
                        console.log('Payment successfully re-allocated to rent periods');
                    }
                }
                catch (allocationError) {
                    console.error('Error in re-allocation process:', allocationError);
                    // Don't fail the payment update if allocation fails
                }
            }
            return (0, client_1.createApiResponse)(data);
        }
        catch (error) {
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
    /**
     * Delete a payment
     */
    static async deletePayment(paymentId) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            // First, get the payment to check if it's a rent payment
            const { data: payment, error: fetchError } = await supabase
                .from('RENT_payments')
                .select('payment_type')
                .eq('id', paymentId)
                .single();
            if (fetchError) {
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(fetchError));
            }
            // Delete the payment
            const { error } = await supabase
                .from('RENT_payments')
                .delete()
                .eq('id', paymentId);
            if (error) {
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
            }
            // If this was a rent payment, we should also remove its allocations
            // Note: This would require a separate RPC function to de-allocate
            // For now, we'll just log that the payment was deleted
            if (payment?.payment_type?.toLowerCase() === 'rent') {
                console.log('Rent payment deleted - allocations may need manual cleanup:', paymentId);
                // TODO: Implement RENT_deallocate_payment RPC function
            }
            return (0, client_1.createApiResponse)(true);
        }
        catch (error) {
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
    /**
     * Get payments for a specific property and date range
     */
    static async getByPropertyAndDateRange(propertyId, startDate, endDate) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            const { data, error } = await supabase
                .from('RENT_payments')
                .select('*')
                .eq('property_id', propertyId)
                .gte('payment_date', startDate)
                .lte('payment_date', endDate)
                .order('payment_date', { ascending: false });
            if (error) {
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
            }
            return (0, client_1.createApiResponse)(data);
        }
        catch (error) {
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
}
exports.PaymentsService = PaymentsService;
