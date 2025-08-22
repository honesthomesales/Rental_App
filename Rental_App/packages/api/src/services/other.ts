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
  static async getAllOtherEntries() {
    return [];
  }
} 