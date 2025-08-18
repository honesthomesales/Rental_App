import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Get environment variables - these will be available at runtime in the browser
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Global singleton instance
let supabaseClient: ReturnType<typeof createClient<Database>> | null = null;

// Create a function to get the client with proper error handling
function createSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
  }
  
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
}

export function getSupabaseClient() {
  if (typeof window === 'undefined') {
    // Server-side: return null or throw error
    throw new Error('Supabase client cannot be used on the server side');
  }
  
  if (!supabaseClient) {
    supabaseClient = createSupabaseClient();
  }
  
  return supabaseClient;
}

// Export the client for backward compatibility (will only work on client side)
export const supabase = (() => {
  if (typeof window === 'undefined') {
    // During build time, return a mock that satisfies all TypeScript requirements
    const mockClient = {
      from: (table: string) => ({
        select: (columns?: string) => ({
          order: (column: string, options?: { ascending: boolean }) => ({
            limit: (count: number) => Promise.resolve({ data: [], error: null })
          }),
          gte: (column: string, value: any) => ({
            lte: (column: string, value: any) => Promise.resolve({ data: [], error: null })
          }),
          insert: (data: any) => ({
            eq: (column: string, value: any) => Promise.resolve({ data: null, error: null })
          }),
          update: (data: any) => ({
            eq: (column: string, value: any) => Promise.resolve({ data: null, error: null })
          }),
          delete: () => ({
            eq: (column: string, value: any) => Promise.resolve({ data: null, error: null })
          })
        })
      })
    };
    return mockClient;
  }
  return getSupabaseClient();
})() as any;

// Helper function to handle Supabase errors
export function handleSupabaseError(error: any): string {
  if (error?.message) {
    return error.message;
  }
  if (error?.error_description) {
    return error.error_description;
  }
  return 'An unexpected error occurred';
}

// Helper function to create API response
export function createApiResponse<T>(data: T | null, error: string | null = null): ApiResponse<T> {
  return {
    data,
    error,
    success: !error
  };
}

// Type for API response
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
} 