"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
exports.getSupabaseClient = getSupabaseClient;
exports.resetSupabaseClient = resetSupabaseClient;
exports.handleSupabaseError = handleSupabaseError;
exports.createApiResponse = createApiResponse;
const supabase_js_1 = require("@supabase/supabase-js");
// React Native compatible environment variables
// These should be set in your React Native app's environment
const supabaseUrl = 'https://gnisgfojzrrnidizrycj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduaXNnZm9qenJybmlkaXpyeWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NjgyMDMsImV4cCI6MjA2NzM0NDIwM30.jLRIt4mqNa-6rnWudT_ciCvfPC0i0WlWFrCgC7NbhYM';
// Global singleton instance with proper lifecycle management
let supabaseClient = null;
let isInitializing = false;
// Create a function to get the client with proper error handling
function createSupabaseClient() {
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase environment variables for React Native.');
    }
    return (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey, {
        auth: {
            autoRefreshToken: false, // Disable to prevent GoTrueClient warnings
            persistSession: false, // Disable to prevent storage issues
            detectSessionInUrl: false, // Disable for React Native
            storageKey: 'rental-app-rn-auth' // Unique storage key for React Native
        },
        global: {
            headers: {
                'X-Client-Info': 'rental-app-rn'
            }
        }
    });
}
function getSupabaseClient() {
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
// Export the client for React Native
exports.supabase = getSupabaseClient();
// Cleanup function for testing or when needed
function resetSupabaseClient() {
    if (supabaseClient) {
        // Clean up any subscriptions or listeners if needed
        supabaseClient = null;
    }
    isInitializing = false;
}
// Helper function to handle Supabase errors
function handleSupabaseError(error) {
    if (error?.message) {
        return error.message;
    }
    if (error?.error_description) {
        return error.error_description;
    }
    return 'An unexpected error occurred';
}
// Helper function to create API response
function createApiResponse(data, error = null) {
    return {
        data,
        error,
        success: !error
    };
}
