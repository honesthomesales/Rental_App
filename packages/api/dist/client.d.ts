import type { Database } from './database.types';
export declare function getSupabaseClient(): import("@supabase/supabase-js").SupabaseClient<Database, "public", "public", never, {
    PostgrestVersion: "12";
}>;
export declare const supabase: import("@supabase/supabase-js").SupabaseClient<Database, "public", "public", never, {
    PostgrestVersion: "12";
}> | null;
export declare function resetSupabaseClient(): void;
export declare function handleSupabaseError(error: any): string;
export declare function createApiResponse<T>(data: T | null, error?: string | null): {
    data: T | null;
    error: string | null;
    success: boolean;
};
