/** @type {import('next').NextConfig} */ const isProd = process.env.NODE_ENV === 'production'; const nextConfig = { output: 'export', basePath: isProd ? '/Rental_App' : '', trailingSlash: true, images: { unoptimized: true }, swcMinify: true, typescript: { ignoreBuildErrors: false }, }; module.exports = nextConfig; 



