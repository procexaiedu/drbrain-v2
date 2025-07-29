/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://erutqtbknunsjfnkeevt.supabase.co/functions/v1/:path*',
      },
    ];
  },
};

module.exports = nextConfig; 