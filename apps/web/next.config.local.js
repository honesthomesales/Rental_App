/** @type {import('next').Config} */
module.exports = {
  output: 'export',
  // No base path for local testing
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  swcMinify: true
};
