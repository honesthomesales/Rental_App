import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// React Native compatible environment variables
// These should be set in your React Native app's environment
const supabaseUrl = 'https://gnisgfojzrrnidizrrnidizrycj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduaXNnZm9qenJybmlkaXpyeWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NjgyMDMsImV4cCI6MjA2NzM0NDIwM30.jLRIt4mqNa-6rnWudT_ciCvfPC0i0WlWFrCgC7NbhYM';

// Global singleton instance
let supabaseClient: ReturnType<typeof createClient<Database>> | null = null;

// Create a function to get the client with proper error handling
function createSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables for React Native.');
  }
  
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false // Disable for React Native
    }
  });
}

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createSupabaseClient();
  }
  
  return supabaseClient;
}

// Export the client for React Native
export const supabase = getSupabaseClient();

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
