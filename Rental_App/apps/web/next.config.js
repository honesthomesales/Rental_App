/** @type {import('next').Config} */
const isProd = process.env.NODE_ENV === 'production';
const isGitHubPages = process.env.GITHUB_PAGES === 'true';

module.exports = {
  // Use static export for both local and production
  output: 'export',
  trailingSlash: true,
  
  // Only use base path for GitHub Pages deployment
  ...(isGitHubPages && {
    basePath: '/My_Rental-App',
    assetPrefix: '/My_Rental-App/',
  }),
  
  images: {
    unoptimized: true
  },
  swcMinify: true
};
