// Configuration management for the rental app
import { env, validateEnv } from './env';

export const config = {
  // Supabase Configuration - now imported from env.ts
  supabase: {
    url: env.supabase.url,
    anonKey: env.supabase.anonKey,
  },
  
  // App Configuration
  app: {
    url: env.app.url,
    environment: env.app.environment,
    isProduction: env.app.isProduction,
    isDevelopment: env.app.isDevelopment,
    basePath: env.app.basePath,
  },
  
  // Feature Flags
  features: env.features,
  
  // Build Configuration
  build: env.build,
};

// Validate configuration on import
if (typeof window !== 'undefined') {
  validateEnv();
}

// Get Supabase configuration
export function getSupabaseConfig() {
  return config.supabase;
}

// Export environment utilities for convenience
export { env, validateEnv, isProduction, isDevelopment, getBasePath } from './env';
