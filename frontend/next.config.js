/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/edge/v1/:path*',
        destination: 'https://erutqtbknunsjfnkeevt.supabase.co/functions/v1/:path*',
      },
    ];
  },
};

module.exports = nextConfig; 