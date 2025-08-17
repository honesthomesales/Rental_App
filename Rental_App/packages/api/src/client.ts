import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Get environment variables - these will be available at runtime in the browser
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

// Create client only on the client side to prevent SSR issues
let supabaseClient: ReturnType<typeof createSupabaseClient> | null = null;

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
export const supabase = typeof window !== 'undefined' ? getSupabaseClient() : null;

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