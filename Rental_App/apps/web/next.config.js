// apps/web/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/Rental_App',
  assetPrefix: '/Rental_App/',
  trailingSlash: true,
  images: { unoptimized: true },
  swcMinify: true,
  typescript: { ignoreBuildErrors: false },
};
module.exports = nextConfig; 