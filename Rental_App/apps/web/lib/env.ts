// Environment configuration for the rental app
export const env = {
  // Supabase Configuration
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gnisgfojzrrnidizrycj.supabase.co',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduaXNnZm9qenJybmlkaXpyeWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NjgyMDMsImV4cCI6MjA2NzM0NDIwM30.jLRIt4mqNa-6rnWudT_ciCvfPC0i0WlWFrCgC7NbhYM',
  },
  
  // App Configuration
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    environment: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
  },
  
  // Feature Flags
  features: {
    enableAuth: false, // Disable auth for now to prevent GoTrueClient issues
    enableRealTime: false,
    enableStorage: false,
    enableStaticExport: true,
  },
  
  // Build Configuration
  build: {
    staticExport: true,
    outputDir: 'out',
    trailingSlash: false,
  }
};

// Validate environment configuration
export function validateEnv() {
  const errors: string[] = [];
  
  if (!env.supabase.url) {
    errors.push('Missing NEXT_PUBLIC_SUPABASE_URL');
  }
  
  if (!env.supabase.anonKey) {
    errors.push('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  
  if (errors.length > 0) {
    console.error('Environment validation failed:', errors);
    return false;
  }
  
  return true;
}

// Get Supabase configuration
export function getSupabaseConfig() {
  return {
    url: env.supabase.url,
    anonKey: env.supabase.anonKey,
  };
}

// Check if running in production
export function isProduction() {
  return env.app.isProduction;
}

// Check if running in development
export function isDevelopment() {
  return env.app.isDevelopment;
}
