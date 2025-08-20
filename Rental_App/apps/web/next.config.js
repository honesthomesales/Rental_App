// apps/web/next.config.js
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  output: 'export',
  basePath: isProd ? '/Rental_App' : '',
  assetPrefix: isProd ? '/Rental_App' : '',
  images: { unoptimized: true },
  trailingSlash: false,
  // Prevent Next.js from embedding basePath in generated URLs
  experimental: {
    // This ensures assets are referenced relative to the basePath
    // rather than having the basePath embedded in the URL
    optimizePackageImports: ['@rental-app/api', '@rental-app/ui']
  }
};

module.exports = nextConfig; 