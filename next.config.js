/** @type {import('next').NextConfig} */
const r2Base = process.env.NEXT_PUBLIC_R2_BASE_URL || '';
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
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '/**'
      }
    ]
  }
};

// If an R2 base URL is provided, add its hostname to image remote patterns
if (r2Base) {
  try {
    const url = new URL(r2Base);
    // allow any path under the provided base host
    nextConfig.images.remotePatterns.push({
      protocol: url.protocol.replace(':', ''),
      hostname: url.hostname,
      pathname: url.pathname === '/' ? '/**' : `${url.pathname.replace(/\/$/, '')}/**`
    });
  } catch {
    // ignore malformed URL, dev can set correct NEXT_PUBLIC_R2_BASE_URL
    console.warn('NEXT_PUBLIC_R2_BASE_URL is not a valid URL:', r2Base);
  }
}

module.exports = nextConfig;
