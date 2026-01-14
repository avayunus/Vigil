/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    return [{
      source: '/api/:path*',
      destination: `${backendUrl}/api/:path*`,
    }];
  },
};