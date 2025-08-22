/** @type {import('next').Config} */
const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  // Only use static export for production builds
  ...(isProd && {
    output: 'export',
    basePath: '/My_Rental-_App',
    assetPrefix: '/My_Rental-_App/',
    trailingSlash: true,
  }),
  images: {
    unoptimized: true
  },
  swcMinify: true
};
