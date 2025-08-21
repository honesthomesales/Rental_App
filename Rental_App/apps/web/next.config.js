/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // CRITICAL: No basePath, no assetPrefix - let GitHub Pages handle paths naturally
  trailingSlash: true,
  images: { unoptimized: true },
  swcMinify: true,
  typescript: { ignoreBuildErrors: false },
};

module.exports = nextConfig; 
