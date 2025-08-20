// apps/web/next.config.js
const nextConfig = {
  output: 'export',
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