import { createClient } from '@supabase/supabase-js'
import { createApiResponse, handleSupabaseError } from '../client'
import type { ApiResponse } from '../types'

export interface RentPeriod {
  id: string
  tenant_id: string
  property_id: string
  lease_id: string
  period_due_date: string
  rent_amount: number
  rent_cadence: string
  status: 'paid' | 'unpaid' | 'partial'
  amount_paid: number
  late_fee_applied: number
  late_fee_waived: boolean
  due_date_override: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface UpdateRentPeriodData {
  late_fee_applied?: number
  late_fee_waived?: boolean
  amount_paid?: number
  status?: 'paid' | 'unpaid' | 'partial'
}

export class RentPeriodsService {
  private static getSupabaseClientSafe() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables')
    }

    return createClient(supabaseUrl, supabaseAnonKey)
  }

  /**
   * Get rent periods for a specific tenant
   */
  static async getTenantRentPeriods(tenantId: string): Promise<ApiResponse<RentPeriod[]>> {
    try {
      const supabase = this.getSupabaseClientSafe()
      
      const { data: periods, error } = await supabase
        .from('RENT_rent_periods')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('period_due_date', { ascending: false })

      if (error) {
        return createApiResponse(null, handleSupabaseError(error))
      }

      return createApiResponse(periods || [])
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error))
    }
  }

  /**
   * Get rent periods for a specific property
   */
  static async getPropertyRentPeriods(propertyId: string): Promise<ApiResponse<RentPeriod[]>> {
    try {
      const supabase = this.getSupabaseClientSafe()
      
      const { data: periods, error } = await supabase
        .from('RENT_rent_periods')
        .select('*')
        .eq('property_id', propertyId)
        .order('period_due_date', { ascending: false })

      if (error) {
        return createApiResponse(null, handleSupabaseError(error))
      }

      return createApiResponse(periods || [])
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error))
    }
  }

  /**
   * Get all rent periods with late fees
   */
  static async getLateRentPeriods(): Promise<ApiResponse<RentPeriod[]>> {
    try {
      const supabase = this.getSupabaseClientSafe()
      
      const { data: periods, error } = await supabase
        .from('RENT_rent_periods')
        .select('*')
        .gt('late_fee_applied', 0)
        .eq('late_fee_waived', false)
        .order('period_due_date', { ascending: false })

      if (error) {
        return createApiResponse(null, handleSupabaseError(error))
      }

      return createApiResponse(periods || [])
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error))
    }
  }

  /**
   * Update a rent period
   */
  static async update(id: string, updateData: UpdateRentPeriodData): Promise<ApiResponse<RentPeriod>> {
    try {
      const supabase = this.getSupabaseClientSafe()
      
      const { data: period, error } = await supabase
        .from('RENT_rent_periods')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('*')
        .single()

      if (error) {
        return createApiResponse(null, handleSupabaseError(error))
      }

      return createApiResponse(period)
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error))
    }
  }

  /**
   * Bulk update multiple rent periods
   */
  static async bulkUpdate(periodIds: string[], updateData: UpdateRentPeriodData): Promise<ApiResponse<RentPeriod[]>> {
    try {
      const supabase = this.getSupabaseClientSafe()
      
      const { data: periods, error } = await supabase
        .from('RENT_rent_periods')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .in('id', periodIds)
        .select('*')

      if (error) {
        return createApiResponse(null, handleSupabaseError(error))
      }

      return createApiResponse(periods || [])
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error))
    }
  }

  /**
   * Waive late fees for multiple periods (set late_fee_waived to true)
   */
  static async waiveLateFees(periodIds: string[]): Promise<ApiResponse<RentPeriod[]>> {
    return this.bulkUpdate(periodIds, { late_fee_waived: true })
  }

  /**
   * Create a new rent period
   */
  static async create(periodData: Omit<RentPeriod, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<RentPeriod>> {
    try {
      const supabase = this.getSupabaseClientSafe()
      
      const { data: period, error } = await supabase
        .from('RENT_rent_periods')
        .insert({
          ...periodData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*')
        .single()

      if (error) {
        return createApiResponse(null, handleSupabaseError(error))
      }

      return createApiResponse(period)
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error))
    }
  }

  /**
   * Delete a rent period
   */
  static async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const supabase = this.getSupabaseClientSafe()
      
      const { error } = await supabase
        .from('RENT_rent_periods')
        .delete()
        .eq('id', id)

      if (error) {
        return createApiResponse(null, handleSupabaseError(error))
      }

      return createApiResponse(true)
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error))
    }
  }
}

