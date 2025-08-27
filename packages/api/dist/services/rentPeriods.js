"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RentPeriodsService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const client_1 = require("../client");
class RentPeriodsService {
    static getSupabaseClientSafe() {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Missing Supabase environment variables');
        }
        return (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey);
    }
    /**
     * Get rent periods for a specific tenant
     */
    static async getTenantRentPeriods(tenantId) {
        try {
            const supabase = this.getSupabaseClientSafe();
            const { data: periods, error } = await supabase
                .from('RENT_rent_periods')
                .select('*')
                .eq('tenant_id', tenantId)
                .order('period_due_date', { ascending: false });
            if (error) {
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
            }
            return (0, client_1.createApiResponse)(periods || []);
        }
        catch (error) {
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
    /**
     * Get rent periods for a specific property
     */
    static async getPropertyRentPeriods(propertyId) {
        try {
            const supabase = this.getSupabaseClientSafe();
            const { data: periods, error } = await supabase
                .from('RENT_rent_periods')
                .select('*')
                .eq('property_id', propertyId)
                .order('period_due_date', { ascending: false });
            if (error) {
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
            }
            return (0, client_1.createApiResponse)(periods || []);
        }
        catch (error) {
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
    /**
     * Get all rent periods with late fees
     */
    static async getLateRentPeriods() {
        try {
            const supabase = this.getSupabaseClientSafe();
            const { data: periods, error } = await supabase
                .from('RENT_rent_periods')
                .select('*')
                .gt('late_fee_applied', 0)
                .eq('late_fee_waived', false)
                .order('period_due_date', { ascending: false });
            if (error) {
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
            }
            return (0, client_1.createApiResponse)(periods || []);
        }
        catch (error) {
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
    /**
     * Update a rent period
     */
    static async update(id, updateData) {
        try {
            const supabase = this.getSupabaseClientSafe();
            const { data: period, error } = await supabase
                .from('RENT_rent_periods')
                .update({
                ...updateData,
                updated_at: new Date().toISOString()
            })
                .eq('id', id)
                .select('*')
                .single();
            if (error) {
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
            }
            return (0, client_1.createApiResponse)(period);
        }
        catch (error) {
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
    /**
     * Bulk update multiple rent periods
     */
    static async bulkUpdate(periodIds, updateData) {
        try {
            const supabase = this.getSupabaseClientSafe();
            const { data: periods, error } = await supabase
                .from('RENT_rent_periods')
                .update({
                ...updateData,
                updated_at: new Date().toISOString()
            })
                .in('id', periodIds)
                .select('*');
            if (error) {
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
            }
            return (0, client_1.createApiResponse)(periods || []);
        }
        catch (error) {
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
    /**
     * Waive late fees for multiple periods (set late_fee_waived to true)
     */
    static async waiveLateFees(periodIds) {
        return this.bulkUpdate(periodIds, { late_fee_waived: true });
    }
    /**
     * Create a new rent period
     */
    static async create(periodData) {
        try {
            const supabase = this.getSupabaseClientSafe();
            const { data: period, error } = await supabase
                .from('RENT_rent_periods')
                .insert({
                ...periodData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
                .select('*')
                .single();
            if (error) {
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
            }
            return (0, client_1.createApiResponse)(period);
        }
        catch (error) {
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
    /**
     * Delete a rent period
     */
    static async delete(id) {
        try {
            const supabase = this.getSupabaseClientSafe();
            const { error } = await supabase
                .from('RENT_rent_periods')
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
}
exports.RentPeriodsService = RentPeriodsService;
