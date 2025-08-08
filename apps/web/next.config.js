// Optional bundle analyzer - only load if available
let withBundleAnalyzer = (config) => config;
try {
  withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
  });
} catch (error) {
  console.log('Bundle analyzer not available, skipping...');
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  // Support GitHub Pages project subpath via env at build time
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH ? `${process.env.NEXT_PUBLIC_BASE_PATH}/` : '',
  // Ensure local packages resolve dependencies from this app's node_modules
  transpilePackages: ['@rental-app/ui', '@rental-app/api'],
  trailingSlash: true,
  generateBuildId: async () => 'build',
  // Always enable static export for GitHub Pages
  output: 'export',
  // Disable image optimization for static export
  images: {
    unoptimized: true,
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    // Disable CSS optimization to avoid requiring 'critters' during static export
    optimizeCss: false,
    optimizePackageImports: ['lucide-react', '@rental-app/ui'],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  compress: true,
  // Remove headers for static export compatibility
  swcMinify: true,
  reactStrictMode: true,
  optimizeFonts: true,
  webpack: (config) => {
    // Treat symlinked packages as packages, not real paths, so resolution uses this app's node_modules
    if (!config.resolve) config.resolve = {}
    config.resolve.symlinks = false
    return config
  },
}

module.exports = withBundleAnalyzer(nextConfig) 