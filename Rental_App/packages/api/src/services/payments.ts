import { supabase, handleSupabaseError, createApiResponse } from '../client';

export class PaymentsService {
  /**
   * Get all payments
   */
  static async getAll() {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('payment_date', { ascending: false });

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      return createApiResponse(data);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }
} 