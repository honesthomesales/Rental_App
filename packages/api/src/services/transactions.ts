import { getSupabaseClient, handleSupabaseError, createApiResponse } from '../client';
import type { Database } from '../database.types';
import type { Transaction, CreateTransactionData, UpdateTransactionData, ApiResponse } from '../types';

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

  static async update(id: string, transactionData: UpdateTransactionData): Promise<ApiResponse<Transaction>> {
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