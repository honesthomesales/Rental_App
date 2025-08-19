/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  output: 'export',
  // Remove basePath and assetPrefix for GitHub Pages deployment
  // basePath: isProd ? '/Rental_App' : '',
  // assetPrefix: isProd ? '/Rental_App/' : '',
  
  // Config updated for GitHub Pages deployment
}; 