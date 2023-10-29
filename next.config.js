module.exports = {
  async rewrites() {
    return [
      // Map API routes
      {
        source: '/api/auth/:path*',
        destination: '/api/auth/:path*',
      },
    ];
  },
};
