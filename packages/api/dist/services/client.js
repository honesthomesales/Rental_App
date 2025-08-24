"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
exports.getSupabaseClient = getSupabaseClient;
exports.handleSupabaseError = handleSupabaseError;
exports.createApiResponse = createApiResponse;
const supabase_js_1 = require("@supabase/supabase-js");
// Get environment variables - these will be available at runtime in the browser
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Global singleton instance
let supabaseClient = null;
// Create a function to get the client with proper error handling
function createSupabaseClient() {
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
    }
    return (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    });
}
function getSupabaseClient() {
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
exports.supabase = (() => {
    if (typeof window === 'undefined') {
        // During build time, return a mock that satisfies all TypeScript requirements
        const mockClient = {
            from: (table) => ({
                select: (columns) => ({
                    order: (column, options) => ({
                        limit: (count) => Promise.resolve({ data: [], error: null })
                    }),
                    gte: (column, value) => ({
                        lte: (column, value) => Promise.resolve({ data: [], error: null })
                    }),
                    insert: (data) => ({
                        eq: (column, value) => Promise.resolve({ data: null, error: null })
                    }),
                    update: (data) => ({
                        eq: (column, value) => Promise.resolve({ data: null, error: null })
                    }),
                    delete: () => ({
                        eq: (column, value) => Promise.resolve({ data: null, error: null })
                    })
                })
            })
        };
        return mockClient;
    }
    return getSupabaseClient();
})();
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
