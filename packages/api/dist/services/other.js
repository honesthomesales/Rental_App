"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtherService = void 0;
const client_1 = require("../client");
class OtherService {
    /**
     * Get all other entries
     */
    static async getAll() {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            const { data, error } = await supabase
                .from('rent_other')
                .select('*')
                .order('date', { ascending: false });
            if (error) {
                console.error('OtherService.getAll error:', error);
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
            }
            return (0, client_1.createApiResponse)(data);
        }
        catch (error) {
            console.error('OtherService.getAll exception:', error);
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
    /**
     * Get other entries by date range
     */
    static async getByDateRange(startDate, endDate) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            const { data, error } = await supabase
                .from('rent_other')
                .select('*')
                .gte('date', startDate)
                .lte('date', endDate)
                .order('date', { ascending: false });
            if (error) {
                console.error('OtherService.getByDateRange error:', error);
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
            }
            return (0, client_1.createApiResponse)(data);
        }
        catch (error) {
            console.error('OtherService.getByDateRange exception:', error);
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
    /**
     * Create a new other entry
     */
    static async create(entryData) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            const { data, error } = await supabase
                .from('rent_other')
                .insert([entryData])
                .select()
                .single();
            if (error) {
                console.error('OtherService.create error:', error);
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
            }
            return (0, client_1.createApiResponse)(data);
        }
        catch (error) {
            console.error('OtherService.create exception:', error);
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
    /**
     * Update an other entry
     */
    static async update(entryData) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            const { id, ...updateData } = entryData;
            const { data, error } = await supabase
                .from('rent_other')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();
            if (error) {
                console.error('OtherService.update error:', error);
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
            }
            return (0, client_1.createApiResponse)(data);
        }
        catch (error) {
            console.error('OtherService.update exception:', error);
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
    /**
     * Delete an other entry
     */
    static async delete(id) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            const { error } = await supabase
                .from('rent_other')
                .delete()
                .eq('id', id);
            if (error) {
                console.error('OtherService.delete error:', error);
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
            }
            return (0, client_1.createApiResponse)(true);
        }
        catch (error) {
            console.error('OtherService.delete exception:', error);
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
}
exports.OtherService = OtherService;
