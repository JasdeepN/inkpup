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
  }
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
