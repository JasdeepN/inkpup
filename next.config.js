const SECURITY_HEADERS = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com https://cloudflareinsights.com",
  "connect-src 'self' https://cloudflareinsights.com https://static.cloudflareinsights.com",
  "img-src 'self' data: blob: https://cloudflareinsights.com https://static.cloudflareinsights.com",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "object-src 'none'",
    ].join('; '),
  },
];

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
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '/**'
      }
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

const publicHostname = process.env.R2_PUBLIC_HOSTNAME;
const accountId = process.env.R2_ACCOUNT_ID;
const bucketName = process.env.R2_BUCKET;

if (publicHostname) {
  try {
    const url = new URL(publicHostname.includes('://') ? publicHostname : `https://${publicHostname}`);
    nextConfig.images.remotePatterns.push({
      protocol: url.protocol.replace(':', ''),
      hostname: url.hostname,
      pathname: url.pathname === '/' ? '/**' : `${url.pathname.replace(/\/$/, '')}/**`
    });
  } catch {
    console.warn('R2_PUBLIC_HOSTNAME is not a valid URL:', publicHostname);
  }
}

if (accountId && bucketName) {
  nextConfig.images.remotePatterns.push({
    protocol: 'https',
    hostname: `${accountId}.r2.cloudflarestorage.com`,
    pathname: `/${bucketName}/**`
  });
}

module.exports = nextConfig;
