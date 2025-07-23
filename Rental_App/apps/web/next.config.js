/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://gnisgfojzrrnidizrycj.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduaXNnZm9qenJybmlkaXpyeWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NjgyMDMsImV4cCI6MjA2NzM0NDIwM30.jLRIt4mqNa-6rnWudT_ciCvfPC0i0WlWFrCgC7NbhYM',
  },
  // Disable static generation for Vercel
  experimental: {
    appDir: true,
  },
  // Force client-side rendering
  trailingSlash: false,
}

module.exports = nextConfig 