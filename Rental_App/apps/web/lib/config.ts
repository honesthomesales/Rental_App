// Runtime configuration for the app
// This file embeds configuration values directly to avoid environment variable issues in static export

export const config = {
  supabase: {
    url: 'https://gnisgfojzrrnidizrycj.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduaXNnZm9qenJybmlkaXpyeWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NjgyMDMsImV4cCI6MjA2NzM0NDIwM30.jLRIt4mqNa-6rnWudT_ciCvfPC0i0WlWFrCgC7NbhYM'
  },
  app: {
    url: typeof window !== 'undefined' 
      ? window.location.origin + window.location.pathname.replace(/\/$/, '')
      : 'https://honesthomesales.github.io/Rental_App'
  }
} as const;
