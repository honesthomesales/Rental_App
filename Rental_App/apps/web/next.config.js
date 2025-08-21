/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  swcMinify: true,
  typescript: { ignoreBuildErrors: false },
};

module.exports = nextConfig; 
