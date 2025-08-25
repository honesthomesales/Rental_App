// Temporarily commented out due to missing RENT_transactions table in database types
/*
import { getSupabaseClient, handleSupabaseError, createApiResponse } from '../client';
import type { Database } from '../database.types';

// Simple response types to avoid circular references
interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

interface Transaction {
  id: string;
  tenant_id?: string;
  property_id?: string;
  lease_id?: string;
  transaction_type: string;
  amount: number;
  transaction_date: string;
  payment_status: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

interface CreateTransactionData {
  tenant_id?: string;
  property_id?: string;
  lease_id?: string;
  transaction_type: string;
  amount: number;
  transaction_date: string;
  payment_status: string;
  notes?: string;
}

interface TransactionUI<T> extends Transaction {
  tenant?: any;
  property?: any;
  lease?: any;
}

export class TransactionsService {
  static async getAll(): Promise<ApiResponse<Transaction[]>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('RENT_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      return createApiResponse(data as Transaction[]);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  static async getById(id: string): Promise<ApiResponse<TransactionUI<Transaction>>> {
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

      return createApiResponse(data as TransactionUI<Transaction>);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  static async create(transactionData: CreateTransactionData): Promise<ApiResponse<Transaction>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('RENT_transactions')
        .insert([transactionData])
        .select('*')
        .single();

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      return createApiResponse(data as Transaction);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  static async update(id: string, transactionData: Partial<CreateTransactionData>): Promise<ApiResponse<Transaction>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('RENT_transactions')
        .update(transactionData)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      return createApiResponse(data as Transaction);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

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

  static async getByTenant(tenantId: string): Promise<ApiResponse<Transaction[]>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('RENT_transactions')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      return createApiResponse(data as Transaction[]);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  static async getByProperty(propertyId: string): Promise<ApiResponse<Transaction[]>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('RENT_transactions')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      return createApiResponse(data as Transaction[]);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  static async getTotalByTenant(tenantId: string): Promise<ApiResponse<number>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('RENT_transactions')
        .select('amount')
        .eq('tenant_id', tenantId);

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      const total = data?.reduce((sum, transaction) => sum + (transaction.amount || 0), 0) || 0;
      return createApiResponse(total);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  static async getTotalByProperty(propertyId: string): Promise<ApiResponse<number>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('RENT_transactions')
        .select('amount')
        .eq('property_id', propertyId);

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
*/

// Temporary placeholder service
export class TransactionsService {
  static async getAll() { return { data: [], error: null, success: true }; }
  static async getById() { return { data: null, error: 'Service temporarily disabled', success: false }; }
  static async create() { return { data: null, error: 'Service temporarily disabled', success: false }; }
  static async update() { return { data: null, error: 'Service temporarily disabled', success: false }; }
  static async delete() { return { data: null, error: 'Service temporarily disabled', success: false }; }
  static async getByTenant() { return { data: [], error: null, success: true }; }
  static async getByProperty() { return { data: [], error: null, success: true }; }
  static async getTotalByTenant() { return { data: 0, error: null, success: true }; }
  static async getTotalByProperty() { return { data: 0, error: null, success: true }; }
} 