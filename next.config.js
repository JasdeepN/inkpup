/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: true
  },
  images: {
    // Use the default loader; when using Cloudflare Images you can change this
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'scontent.cdninstagram.com',
        pathname: '/**'
      }
      ,
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '/**'
      }
    ]
  }
};

module.exports = nextConfig;
