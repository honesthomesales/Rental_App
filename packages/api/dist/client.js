"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
exports.getSupabaseClient = getSupabaseClient;
exports.resetSupabaseClient = resetSupabaseClient;
exports.handleSupabaseError = handleSupabaseError;
exports.createApiResponse = createApiResponse;
const supabase_js_1 = require("@supabase/supabase-js");
// Environment variables for configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gnisgfojzrrnidizrycj.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduaXNnZm9qenJybmlkaXpyeWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NjgyMDMsImV4cCI6MjA2NzM0NDIwM30.jLRIt4mqNa-6rnWudT_ciCvfPC0i0WlWFrCgC7NbhYM';
// Global singleton instance with proper lifecycle management
let supabaseClient = null;
let isInitializing = false;
// Create a function to get the client with proper error handling
function createSupabaseClient() {
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration is missing. Please check your environment variables.');
    }
    return (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey, {
        auth: {
            autoRefreshToken: false, // Disable to prevent GoTrueClient warnings
            persistSession: false, // Disable to prevent storage issues
            detectSessionInUrl: false, // Disable for static export compatibility
            storageKey: 'rental-app-auth' // Unique storage key to prevent conflicts
        },
        global: {
            headers: {
                'X-Client-Info': 'rental-app-web'
            }
        }
    });
}
function getSupabaseClient() {
    // Server-side check
    if (typeof window === 'undefined') {
        throw new Error('Supabase client cannot be used on the server side');
    }
    // Return existing client if available
    if (supabaseClient) {
        return supabaseClient;
    }
    // Prevent multiple simultaneous initializations
    if (isInitializing) {
        throw new Error('Supabase client is already being initialized');
    }
    // Create new client
    try {
        isInitializing = true;
        supabaseClient = createSupabaseClient();
        return supabaseClient;
    }
    finally {
        isInitializing = false;
    }
}
// Export a single instance getter to prevent multiple clients
exports.supabase = (() => {
    if (typeof window === 'undefined') {
        return null;
    }
    try {
        return getSupabaseClient();
    }
    catch (error) {
        console.error('Failed to get Supabase client:', error);
        return null;
    }
})();
// Cleanup function for testing or when needed
function resetSupabaseClient() {
    if (supabaseClient) {
        // Clean up any subscriptions or listeners if needed
        supabaseClient = null;
    }
    isInitializing = false;
}
function handleSupabaseError(error) {
    if (error?.message) {
        return error.message;
    }
    if (error?.error_description) {
        return error.error_description;
    }
    return 'An unexpected error occurred';
}
// Helper function to create API response - maintain original signature for compatibility
function createApiResponse(data, error = null) {
    return {
        data,
        error,
        success: !error
    };
}
