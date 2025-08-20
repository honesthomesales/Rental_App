// apps/web/next.config.js
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  output: 'export',
  basePath: isProd ? '/Rental_App' : '',
  images: { unoptimized: true },
  trailingSlash: false,
};

module.exports = nextConfig; 