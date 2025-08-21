/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  output: 'export',
  // CRITICAL: Use ONLY basePath, NOT assetPrefix to prevent double prefixing
  basePath: isProd ? '/Rental_App' : '',
  trailingSlash: true,
  images: { unoptimized: true },
  swcMinify: true,
  typescript: { ignoreBuildErrors: false },
};

module.exports = nextConfig; 