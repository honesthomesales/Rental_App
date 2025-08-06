import { getSupabaseClient, handleSupabaseError, createApiResponse } from '../client';
import type { ApiResponse } from '../types';

export interface OtherEntry {
  id: string
  date: string
  type: 'expense' | 'income'
  amount: number
  description: string
  created_at: string
  updated_at: string
}

export interface CreateOtherEntryData {
  date: string
  type: 'expense' | 'income'
  amount: number
  description: string
}

export interface UpdateOtherEntryData extends Partial<CreateOtherEntryData> {
  id: string
}

export class OtherService {
  /**
   * Get all other entries
   */
  static async getAll(): Promise<ApiResponse<OtherEntry[]>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('RENT_other')
        .select('*')
        .order('date', { ascending: false })

      if (error) {
        console.error('OtherService.getAll error:', error)
        return createApiResponse(null, handleSupabaseError(error))
      }

      return createApiResponse(data as OtherEntry[])
    } catch (error) {
      console.error('OtherService.getAll exception:', error)
      return createApiResponse(null, handleSupabaseError(error))
    }
  }

  /**
   * Get other entries by date range
   */
  static async getByDateRange(startDate: string, endDate: string): Promise<ApiResponse<OtherEntry[]>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('RENT_other')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })

      if (error) {
        console.error('OtherService.getByDateRange error:', error)
        return createApiResponse(null, handleSupabaseError(error))
      }

      return createApiResponse(data as OtherEntry[])
    } catch (error) {
      console.error('OtherService.getByDateRange exception:', error)
      return createApiResponse(null, handleSupabaseError(error))
    }
  }

  /**
   * Create a new other entry
   */
  static async create(entryData: CreateOtherEntryData): Promise<ApiResponse<OtherEntry>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('RENT_other')
        .insert([entryData])
        .select()
        .single()

      if (error) {
        console.error('OtherService.create error:', error)
        return createApiResponse(null, handleSupabaseError(error))
      }

      return createApiResponse(data as OtherEntry)
    } catch (error) {
      console.error('OtherService.create exception:', error)
      return createApiResponse(null, handleSupabaseError(error))
    }
  }

  /**
   * Update an other entry
   */
  static async update(entryData: UpdateOtherEntryData): Promise<ApiResponse<OtherEntry>> {
    try {
      const supabase = getSupabaseClient();
      const { id, ...updateData } = entryData
      const { data, error } = await supabase
        .from('RENT_other')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('OtherService.update error:', error)
        return createApiResponse(null, handleSupabaseError(error))
      }

      return createApiResponse(data as OtherEntry)
    } catch (error) {
      console.error('OtherService.update exception:', error)
      return createApiResponse(null, handleSupabaseError(error))
    }
  }

  /**
   * Delete an other entry
   */
  static async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('RENT_other')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('OtherService.delete error:', error)
        return createApiResponse(null, handleSupabaseError(error))
      }

      return createApiResponse(true)
    } catch (error) {
      console.error('OtherService.delete exception:', error)
      return createApiResponse(null, handleSupabaseError(error))
    }
  }
} 