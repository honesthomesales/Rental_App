/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  output: 'export',
  basePath: isProd ? '/Rental_App' : '',
  // IMPORTANT: do NOT set assetPrefix at all; basePath will handle _next paths.
  trailingSlash: true,
  images: { unoptimized: true },
  swcMinify: true,
  typescript: { ignoreBuildErrors: false },
};

module.exports = nextConfig; 