/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';
const path = require('path');

module.exports = {
  output: 'export',
  basePath: isProd ? '/My_Rental-_App' : '',
  assetPrefix: isProd ? '/My_Rental-_App/' : '',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  swcMinify: true,
  // Specify the correct source directory
  experimental: {
    appDir: true
  },
  // Point to the correct source files
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'apps/web'),
      '@rental-app/api': path.resolve(__dirname, 'packages/api'),
      '@rental-app/ui': path.resolve(__dirname, 'packages/ui'),
    };
    return config;
  },
};
