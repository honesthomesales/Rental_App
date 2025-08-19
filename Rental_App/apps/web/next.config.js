/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  output: 'export',
  // GitHub Pages deployment - no basePath needed
}; 