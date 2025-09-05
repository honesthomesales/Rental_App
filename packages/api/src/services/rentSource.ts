import { getSupabaseClient, handleSupabaseError, createApiResponse } from '../client';
import type { Database } from '../database.types';
import type { ApiResponse } from '../types';

/**
 * Centralized rent source service
 * This service provides a single source of truth for rent data from RENT_leases
 */
export class RentSourceService {
  /**
   * Get rent amount for a property from its active lease
   */
  static async getRentAmount(propertyId: string): Promise<ApiResponse<number>> {
    try {
      const supabase = getSupabaseClient();
      
      const { data: lease, error } = await supabase
        .from('RENT_leases')
        .select('rent')
        .eq('property_id', propertyId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        return createApiResponse(0, handleSupabaseError(error));
      }

      return createApiResponse(lease?.rent || 0);
    } catch (error) {
      return createApiResponse(0, handleSupabaseError(error));
    }
  }

  /**
   * Get rent cadence for a property from its active lease
   */
  static async getRentCadence(propertyId: string): Promise<ApiResponse<string>> {
    try {
      const supabase = getSupabaseClient();
      
      const { data: lease, error } = await supabase
        .from('RENT_leases')
        .select('rent_cadence')
        .eq('property_id', propertyId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        return createApiResponse('monthly', handleSupabaseError(error));
      }

      return createApiResponse(lease?.rent_cadence || 'monthly');
    } catch (error) {
      return createApiResponse('monthly', handleSupabaseError(error));
    }
  }

  /**
   * Get complete lease data for a property
   */
  static async getActiveLease(propertyId: string): Promise<ApiResponse<any>> {
    try {
      const supabase = getSupabaseClient();
      
      const { data: lease, error } = await supabase
        .from('RENT_leases')
        .select('*')
        .eq('property_id', propertyId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      return createApiResponse(lease);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Get rent data for a tenant from their active lease
   */
  static async getTenantRentData(tenantId: string): Promise<ApiResponse<{
    rent: number;
    rent_cadence: string;
    late_fee_amount: number;
    move_in_fee: number;
  }>> {
    try {
      const supabase = getSupabaseClient();
      
      const { data: lease, error } = await supabase
        .from('RENT_leases')
        .select('rent, rent_cadence, late_fee_amount, move_in_fee')
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        return createApiResponse({
          rent: 0,
          rent_cadence: 'monthly',
          late_fee_amount: 0,
          move_in_fee: 0
        }, handleSupabaseError(error));
      }

      return createApiResponse({
        rent: lease?.rent || 0,
        rent_cadence: lease?.rent_cadence || 'monthly',
        late_fee_amount: lease?.late_fee_amount || 0,
        move_in_fee: lease?.move_in_fee || 0
      });
    } catch (error) {
      return createApiResponse({
        rent: 0,
        rent_cadence: 'monthly',
        late_fee_amount: 0,
        move_in_fee: 0
      }, handleSupabaseError(error));
    }
  }

  /**
   * Get late fee amount based on rent cadence
   */
  static getLateFeeAmount(rentCadence: string): number {
    const normalized = rentCadence.toLowerCase().trim();
    switch (normalized) {
      case 'weekly': return 10;
      case 'bi-weekly': 
      case 'biweekly': return 20;
      case 'monthly': return 45;
      default: return 45;
    }
  }

  /**
   * Normalize rent to monthly amount for calculations
   */
  static normalizeRentToMonthly(rent: number, cadence: string): number {
    const normalized = cadence.toLowerCase().trim();
    switch (normalized) {
      case 'weekly': return rent * 4.33; // Average weeks per month
      case 'bi-weekly':
      case 'biweekly': return rent * 2.17; // Average bi-weekly periods per month
      case 'monthly': return rent;
      default: return rent;
    }
  }
}
