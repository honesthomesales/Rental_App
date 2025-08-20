import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Use embedded configuration instead of environment variables for static export compatibility
const supabaseUrl = 'https://gnisgfojzrrnidizrycj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduaXNnZm9qenJybmlkaXpyeWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NjgyMDMsImV4cCI6MjA2NzM0NDIwM30.jLRIt4mqNa-6rnWudT_ciCvfPC0i0WlWFrCgC7NbhYM';

// Global singleton instance
let supabaseClient: ReturnType<typeof createClient<Database>> | null = null;

// Create a function to get the client with proper error handling
function createSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration is missing. Please check the configuration file.');
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

// Export a single instance to prevent multiple clients
export const supabase = (() => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  if (!supabaseClient) {
    supabaseClient = createSupabaseClient();
  }
  
  return supabaseClient;
})();

export function handleSupabaseError(error: any): string {
  if (error?.message) {
    return error.message;
  }
  if (error?.error_description) {
    return error.error_description;
  }
  return 'An unexpected error occurred';
}

// Helper function to create API response - maintain original signature for compatibility
export function createApiResponse<T>(data: T | null, error: string | null = null): { data: T | null; error: string | null; success: boolean } {
  return {
    data,
    error,
    success: !error
  };
} 