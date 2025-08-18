/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://gnisgfojzrrnidizrycj.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduaXNnZm9qenJybmlkaXpyeWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NjgyMDMsImV4cCI6MjA2NzM0NDIwM30.jLRIt4mqNa-6rnWudT_ciCvfPC0i0WlWFrCgC7NbhYM',
  },
  
  // Static export for GitHub Pages
  output: 'export',
  basePath: '/Rental_App',
  assetPrefix: '/Rental_App/',
  trailingSlash: true,
  distDir: 'out',
  generateBuildId: async () => {
    return 'build'
  },
  
  // Handle dynamic routes for static export
  trailingSlash: true,
  
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  
  // Image optimization
  images: {
    domains: ['gnisgfojzrrnidizrycj.supabase.co'],
    formats: ['image/webp', 'image/avif'],
    unoptimized: true, // Required for static export
  },
  
  // Bundle optimization
  experimental: {
    optimizePackageImports: ['lucide-react', '@rental-app/ui'],
  },
  
  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle size
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
          },
        },
      }
    }
    
    return config
  },
}

module.exports = nextConfig 