"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertiesService = void 0;
const client_1 = require("../client");
const leases_1 = require("./leases");
class PropertiesService {
    /**
     * Get all properties with optional filtering
     */
    static async getAll(filters) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            // Build the base query with field selection to reduce payload
            let query = supabase
                .from('RENT_properties')
                .select(`
          id,
          name,
          address,
          city,
          state,
          zip_code,
          property_type,
          status,
          bedrooms,
          bathrooms,
          square_feet,
          year_built,
          purchase_price,
          purchase_date,
          current_value,
          is_for_rent,
          is_for_sale,
          insurance_premium,
          notes,
          created_at,
          updated_at
        `)
                .order('created_at', { ascending: false });
            // Apply filters
            if (filters?.is_for_rent !== undefined) {
                query = query.eq('is_for_rent', filters.is_for_rent);
            }
            if (filters?.is_for_sale !== undefined) {
                query = query.eq('is_for_sale', filters.is_for_sale);
            }
            if (filters?.city) {
                query = query.eq('city', filters.city);
            }
            if (filters?.state) {
                query = query.eq('state', filters.state);
            }
            const { data: properties, error } = await query;
            if (error) {
                console.error('PropertiesService.getAll error:', error);
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
            }
            // Get lease status for all properties
            const leaseStatusResponse = await leases_1.LeasesService.getAllPropertiesWithLeaseStatus();
            if (!leaseStatusResponse.success || !leaseStatusResponse.data) {
                // Return properties without lease status rather than failing completely
                return (0, client_1.createApiResponse)(properties);
            }
            const leaseStatusMap = new Map(leaseStatusResponse.data.map(item => [item.property_id, item]));
            // Attach lease status and update property status based on active leases
            const propertiesWithLeaseStatus = properties.map(property => {
                const leaseStatus = leaseStatusMap.get(property.id);
                const hasActiveLeases = leaseStatus?.has_active_lease || false;
                // Update property status based on active leases
                const newStatus = hasActiveLeases ? 'rented' : 'empty';
                return {
                    ...property,
                    status: newStatus, // Cast to avoid type issues
                    active_leases: leaseStatus?.active_leases || [],
                    active_lease_count: leaseStatus?.active_lease_count || 0
                };
            });
            return (0, client_1.createApiResponse)(propertiesWithLeaseStatus);
        }
        catch (error) {
            console.error('PropertiesService.getAll exception:', error);
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
    /**
     * Get a property by ID
     */
    static async getById(id) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            const { data, error } = await supabase
                .from('RENT_properties')
                .select('*')
                .eq('id', id)
                .single();
            if (error) {
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
            }
            // Fetch tenants for this property (only active ones)
            const { data: tenantsData } = await supabase
                .from('RENT_tenants')
                .select('*')
                .eq('property_id', id)
                .eq('is_active', true);
            const propertyWithTenants = {
                ...data,
                tenants: tenantsData || []
            };
            return (0, client_1.createApiResponse)(propertyWithTenants);
        }
        catch (error) {
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
    /**
     * Create a new property
     */
    static async create(propertyData) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            const { data, error } = await supabase
                .from('RENT_properties')
                .insert([propertyData])
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
     * Update an existing property
     */
    static async update(id, propertyData) {
        try {
            console.log('🔍 PropertiesService.update - Updating property:', id, 'with data:', propertyData);
            const supabase = (0, client_1.getSupabaseClient)();
            const { data, error } = await supabase
                .from('RENT_properties')
                .update(propertyData)
                .eq('id', id)
                .select()
                .single();
            console.log('🔍 PropertiesService.update - Supabase response:', { data, error });
            if (error) {
                console.error('❌ PropertiesService.update - Supabase error:', error);
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
            }
            console.log('✅ PropertiesService.update - Successfully updated property:', data);
            return (0, client_1.createApiResponse)(data);
        }
        catch (error) {
            console.error('💥 PropertiesService.update - Unexpected error:', error);
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
    /**
     * Delete a property
     */
    static async delete(id) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            const { error } = await supabase
                .from('RENT_properties')
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
     * Get paginated properties
     */
    static async getPaginated(page = 1, limit = 10, filters) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            const offset = (page - 1) * limit;
            let query = supabase
                .from('RENT_properties')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);
            if (filters?.is_for_rent !== undefined) {
                query = query.eq('is_for_rent', filters.is_for_rent);
            }
            if (filters?.is_for_sale !== undefined) {
                query = query.eq('is_for_sale', filters.is_for_sale);
            }
            if (filters?.city) {
                query = query.eq('city', filters.city);
            }
            if (filters?.state) {
                query = query.eq('state', filters.state);
            }
            const { data, error, count } = await query;
            if (error) {
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
            }
            // Fetch tenants for each property
            const propertiesWithTenants = await Promise.all(data.map(async (property) => {
                const { data: tenantsData } = await supabase
                    .from('RENT_tenants')
                    .select('*')
                    .eq('property_id', property.id);
                return {
                    ...property,
                    tenants: tenantsData || []
                };
            }));
            const total = count || 0;
            const hasMore = offset + limit < total;
            const response = {
                data: propertiesWithTenants,
                total,
                page,
                limit,
                hasMore
            };
            return (0, client_1.createApiResponse)(response);
        }
        catch (error) {
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
    /**
     * Search properties
     */
    static async search(searchTerm) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            const { data, error } = await supabase
                .from('RENT_properties')
                .select('*')
                .or(`name.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`)
                .order('created_at', { ascending: false });
            if (error) {
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
            }
            // Fetch tenants for each property
            const propertiesWithTenants = await Promise.all(data.map(async (property) => {
                const { data: tenantsData } = await supabase
                    .from('RENT_tenants')
                    .select('*')
                    .eq('property_id', property.id);
                return {
                    ...property,
                    tenants: tenantsData || []
                };
            }));
            return (0, client_1.createApiResponse)(propertiesWithTenants);
        }
        catch (error) {
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
    /**
     * Get properties available for rent
     */
    static async getAvailableForRent() {
        return this.getAll({ is_for_rent: true });
    }
    /**
     * Get properties available for sale
     */
    static async getAvailableForSale() {
        return this.getAll({ is_for_sale: true });
    }
}
exports.PropertiesService = PropertiesService;
