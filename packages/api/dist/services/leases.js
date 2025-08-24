"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeasesService = void 0;
const client_1 = require("../client");
class LeasesService {
    /**
     * Get all leases
     */
    static async getAll() {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            const { data, error } = await supabase
                .from('RENT_leases')
                .select('*')
                .order('lease_start_date', { ascending: false });
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
     * Get leases for a specific property
     */
    static async getByPropertyId(propertyId) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            const { data, error } = await supabase
                .from('RENT_leases')
                .select('*')
                .eq('property_id', propertyId)
                .order('lease_start_date', { ascending: false });
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
     * Get active leases for a property (current date is between start and end dates)
     */
    static async getActiveLeasesByPropertyId(propertyId) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            const today = new Date().toISOString().split('T')[0];
            const { data, error } = await supabase
                .from('RENT_leases')
                .select('*')
                .eq('property_id', propertyId)
                .lte('lease_start_date', today)
                .gte('lease_end_date', today)
                .order('lease_start_date', { ascending: false });
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
     * Check if a property has active leases
     */
    static async hasActiveLeases(propertyId) {
        try {
            const activeLeasesResponse = await this.getActiveLeasesByPropertyId(propertyId);
            if (!activeLeasesResponse.success) {
                return (0, client_1.createApiResponse)(false);
            }
            const hasActiveLeases = activeLeasesResponse.data && activeLeasesResponse.data.length > 0;
            return (0, client_1.createApiResponse)(hasActiveLeases);
        }
        catch (error) {
            return (0, client_1.createApiResponse)(false);
        }
    }
    /**
     * Create a new lease
     */
    static async create(leaseData) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            const { data, error } = await supabase
                .from('RENT_leases')
                .insert([leaseData])
                .select()
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
     * Update an existing lease
     */
    static async update(id, updateData) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            const { data, error } = await supabase
                .from('RENT_leases')
                .update(updateData)
                .eq('id', id)
                .select()
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
     * Delete a lease
     */
    static async delete(id) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            const { error } = await supabase
                .from('RENT_leases')
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
     * Update lease status based on current date
     */
    static async updateLeaseStatus(leaseId) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            const today = new Date().toISOString().split('T')[0];
            // Get the lease
            const { data: lease, error: fetchError } = await supabase
                .from('RENT_leases')
                .select('*')
                .eq('id', leaseId)
                .single();
            if (fetchError) {
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(fetchError));
            }
            // Determine status based on dates
            let newStatus = 'active';
            if (today < lease.lease_start_date) {
                newStatus = 'pending';
            }
            else if (today > lease.lease_end_date) {
                newStatus = 'expired';
            }
            // Update status if it changed
            if (lease.status !== newStatus) {
                return await this.update(leaseId, { status: newStatus });
            }
            return (0, client_1.createApiResponse)(lease);
        }
        catch (error) {
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
    /**
     * Get all properties with their active lease status
     */
    static async getAllPropertiesWithLeaseStatus() {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            // Get all leases with status = 'active'
            const { data: activeLeases, error } = await supabase
                .from('RENT_leases')
                .select('*')
                .eq('status', 'active');
            if (error) {
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
            }
            // Group active leases by property
            const propertyLeaseMap = new Map();
            (activeLeases || []).forEach(lease => {
                if (!propertyLeaseMap.has(lease.property_id)) {
                    propertyLeaseMap.set(lease.property_id, []);
                }
                propertyLeaseMap.get(lease.property_id).push(lease);
            });
            // Get all properties
            const { data: properties, error: propertiesError } = await supabase
                .from('RENT_properties')
                .select('id');
            if (propertiesError) {
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(propertiesError));
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
            return (0, client_1.createApiResponse)(result);
        }
        catch (error) {
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
}
exports.LeasesService = LeasesService;
