// apps/web/next.config.js
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  output: 'export',
  basePath: isProd ? '/Rental_App' : '',
  images: { unoptimized: true },
  trailingSlash: false,
  
  // Optimize for static export
  swcMinify: true,
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig; 