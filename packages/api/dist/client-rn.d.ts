import type { Database } from './database.types';
export declare function getSupabaseClient(): import("@supabase/supabase-js").SupabaseClient<Database, "public", any>;
export declare const supabase: import("@supabase/supabase-js").SupabaseClient<Database, "public", any>;
export declare function resetSupabaseClient(): void;
export declare function handleSupabaseError(error: any): string;
export declare function createApiResponse<T>(data: T | null, error?: string | null): ApiResponse<T>;
export interface ApiResponse<T> {
    data: T | null;
    error: string | null;
    success: boolean;
}
