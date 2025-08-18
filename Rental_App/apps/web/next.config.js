/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  output: 'export',
  basePath: isProd ? '/Rental_App' : '',
  assetPrefix: isProd ? '/Rental_App/' : '',
}; 