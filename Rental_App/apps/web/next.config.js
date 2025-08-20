// apps/web/next.config.js
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  // Static export (no next export command needed in Next 14+)
  output: 'export',

  // Use ONE prefix only; Next will prepend this to routes and _next assets
  basePath: isProd ? '/Rental_App' : '',

  // Required for GH Pages (no image optimizer runtime)
  images: { unoptimized: true },

  // Ensure trailingSlash OFF (default). If you had it on, keep it off unless
  // you also adjust all links and GH Pages settings consistently.
  trailingSlash: false,
};

module.exports = nextConfig; 