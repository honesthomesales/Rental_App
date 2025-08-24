"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsService = void 0;
const client_1 = require("../client");
class TransactionsService {
    /**
     * Get all transactions with optional filtering
     */
    static async getAll(filters) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            let query = supabase
                .from('RENT_transactions')
                .select('*')
                .order('transaction_date', { ascending: false });
            if (filters?.transaction_type) {
                query = query.eq('transaction_type', filters.transaction_type);
            }
            if (filters?.tenant_id) {
                query = query.eq('tenant_id', filters.tenant_id);
            }
            if (filters?.property_id) {
                query = query.eq('property_id', filters.property_id);
            }
            if (filters?.payment_status) {
                query = query.eq('payment_status', filters.payment_status);
            }
            if (filters?.start_date) {
                query = query.gte('transaction_date', filters.start_date);
            }
            if (filters?.end_date) {
                query = query.lte('transaction_date', filters.end_date);
            }
            const { data, error } = await query;
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
     * Get a transaction by ID
     */
    static async getById(id) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            const { data, error } = await supabase
                .from('RENT_transactions')
                .select('*')
                .eq('id', id)
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
     * Create a new transaction
     */
    static async create(transactionData) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            const { data, error } = await supabase
                .from('RENT_transactions')
                .insert([transactionData])
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
     * Update an existing transaction
     */
    static async update(id, transactionData) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            const { data, error } = await supabase
                .from('RENT_transactions')
                .update(transactionData)
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
     * Delete a transaction
     */
    static async delete(id) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            const { error } = await supabase
                .from('RENT_transactions')
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
     * Get paginated transactions
     */
    static async getPaginated(page = 1, limit = 10, filters) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            const offset = (page - 1) * limit;
            let query = supabase
                .from('RENT_transactions')
                .select('*', { count: 'exact' })
                .order('transaction_date', { ascending: false })
                .range(offset, offset + limit - 1);
            if (filters?.transaction_type) {
                query = query.eq('transaction_type', filters.transaction_type);
            }
            if (filters?.tenant_id) {
                query = query.eq('tenant_id', filters.tenant_id);
            }
            if (filters?.property_id) {
                query = query.eq('property_id', filters.property_id);
            }
            if (filters?.payment_status) {
                query = query.eq('payment_status', filters.payment_status);
            }
            if (filters?.start_date) {
                query = query.gte('transaction_date', filters.start_date);
            }
            if (filters?.end_date) {
                query = query.lte('transaction_date', filters.end_date);
            }
            const { data, error, count } = await query;
            if (error) {
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
            }
            const total = count || 0;
            const hasMore = offset + limit < total;
            const response = {
                data: data,
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
     * Get rent payments
     */
    static async getRentPayments(filters) {
        return this.getAll({
            transaction_type: 'rent_payment',
            ...filters
        });
    }
    /**
     * Get loan payments
     */
    static async getLoanPayments(filters) {
        return this.getAll({
            transaction_type: 'loan_payment',
            ...filters
        });
    }
    /**
     * Get transactions by date range
     */
    static async getByDateRange(startDate, endDate) {
        return this.getAll({
            start_date: startDate,
            end_date: endDate
        });
    }
    /**
     * Get total income for a date range
     */
    static async getTotalIncome(startDate, endDate) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            const { data, error } = await supabase
                .from('RENT_transactions')
                .select('amount')
                .in('transaction_type', ['rent_payment', 'income', 'property_sale'])
                .gte('transaction_date', startDate)
                .lte('transaction_date', endDate)
                .eq('payment_status', 'completed');
            if (error) {
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
            }
            const total = data?.reduce((sum, transaction) => sum + (transaction.amount || 0), 0) || 0;
            return (0, client_1.createApiResponse)(total);
        }
        catch (error) {
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
    /**
     * Get total expenses for a date range
     */
    static async getTotalExpenses(startDate, endDate) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            const { data, error } = await supabase
                .from('RENT_transactions')
                .select('amount')
                .in('transaction_type', ['expense', 'loan_payment', 'property_purchase'])
                .gte('transaction_date', startDate)
                .lte('transaction_date', endDate)
                .eq('payment_status', 'completed');
            if (error) {
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
            }
            const total = data?.reduce((sum, transaction) => sum + (transaction.amount || 0), 0) || 0;
            return (0, client_1.createApiResponse)(total);
        }
        catch (error) {
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
}
exports.TransactionsService = TransactionsService;
