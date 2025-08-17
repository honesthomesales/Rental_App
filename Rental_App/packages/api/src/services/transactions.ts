import { getSupabaseClient, handleSupabaseError, createApiResponse } from '../client';
import type { Transaction, CreateTransactionData, UpdateTransactionData, ApiResponse, PaginatedResponse } from '../types';

export class TransactionsService {
  /**
   * Get all transactions with optional filtering
   */
  static async getAll(filters?: {
    transaction_type?: string;
    tenant_id?: string;
    property_id?: string;
    payment_status?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<Transaction[]>> {
    try {
      const supabase = getSupabaseClient();
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
        return createApiResponse(null, handleSupabaseError(error));
      }

      return createApiResponse(data as Transaction[]);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Get a transaction by ID
   */
  static async getById(id: string): Promise<ApiResponse<Transaction>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('RENT_transactions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      return createApiResponse(data as Transaction);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Create a new transaction
   */
  static async create(transactionData: CreateTransactionData): Promise<ApiResponse<Transaction>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('RENT_transactions')
        .insert([transactionData])
        .select()
        .single();

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      return createApiResponse(data as Transaction);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Update an existing transaction
   */
  static async update(id: string, transactionData: UpdateTransactionData): Promise<ApiResponse<Transaction>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('RENT_transactions')
        .update(transactionData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      return createApiResponse(data as Transaction);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Delete a transaction
   */
  static async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('RENT_transactions')
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
   * Get paginated transactions
   */
  static async getPaginated(
    page: number = 1,
    limit: number = 10,
    filters?: {
      transaction_type?: string;
      tenant_id?: string;
      property_id?: string;
      payment_status?: string;
      start_date?: string;
      end_date?: string;
    }
  ): Promise<ApiResponse<PaginatedResponse<Transaction>>> {
    try {
      const supabase = getSupabaseClient();
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
        return createApiResponse(null, handleSupabaseError(error));
      }

      const total = count || 0;
      const hasMore = offset + limit < total;

      const response: PaginatedResponse<Transaction> = {
        data: data as Transaction[],
        total,
        page,
        limit,
        hasMore
      };

      return createApiResponse(response);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Get rent payments
   */
  static async getRentPayments(filters?: {
    tenant_id?: string;
    property_id?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<Transaction[]>> {
    return this.getAll({
      transaction_type: 'rent_payment',
      ...filters
    });
  }

  /**
   * Get loan payments
   */
  static async getLoanPayments(filters?: {
    loan_id?: string;
    property_id?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<Transaction[]>> {
    return this.getAll({
      transaction_type: 'loan_payment',
      ...filters
    });
  }

  /**
   * Get transactions by date range
   */
  static async getByDateRange(startDate: string, endDate: string): Promise<ApiResponse<Transaction[]>> {
    return this.getAll({
      start_date: startDate,
      end_date: endDate
    });
  }

  /**
   * Get total income for a date range
   */
  static async getTotalIncome(startDate: string, endDate: string): Promise<ApiResponse<number>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('RENT_transactions')
        .select('amount')
        .in('transaction_type', ['rent_payment', 'income', 'property_sale'])
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .eq('payment_status', 'completed');

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      const total = data?.reduce((sum, transaction) => sum + (transaction.amount || 0), 0) || 0;
      return createApiResponse(total);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Get total expenses for a date range
   */
  static async getTotalExpenses(startDate: string, endDate: string): Promise<ApiResponse<number>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('RENT_transactions')
        .select('amount')
        .in('transaction_type', ['expense', 'loan_payment', 'property_purchase'])
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .eq('payment_status', 'completed');

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      const total = data?.reduce((sum, transaction) => sum + (transaction.amount || 0), 0) || 0;
      return createApiResponse(total);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }
} 