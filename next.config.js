const publicHostname = process.env.R2_PUBLIC_HOSTNAME;
const accountId = process.env.R2_ACCOUNT_ID;
const bucketName = process.env.R2_BUCKET;

const cspDirectives = {
  "default-src": ["'self'"],
  "script-src": [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    'https://static.cloudflareinsights.com',
    'https://cloudflareinsights.com',
  ],
  "connect-src": [
    "'self'",
    'https://cloudflareinsights.com',
    'https://static.cloudflareinsights.com',
  ],
  "img-src": [
    "'self'",
    'data:',
    'blob:',
    'https://cloudflareinsights.com',
    'https://static.cloudflareinsights.com',
  ],
  "style-src": ["'self'", "'unsafe-inline'"],
  "font-src": ["'self'", 'data:'],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'self'"],
  "object-src": ["'none'"]
};

const addCspSource = (directive, value) => {
  const sources = cspDirectives[directive];
  if (!sources) return;
  if (!sources.includes(value)) {
    sources.push(value);
  }
};

let parsedPublicUrl = null;

if (publicHostname) {
  try {
    parsedPublicUrl = new URL(
      publicHostname.includes('://') ? publicHostname : `https://${publicHostname}`
    );
    addCspSource('img-src', `${parsedPublicUrl.protocol}//${parsedPublicUrl.host}`);
  } catch {
    console.warn('R2_PUBLIC_HOSTNAME is not a valid URL:', publicHostname);
  }
}

if (accountId && bucketName) {
  addCspSource('img-src', `https://${accountId}.r2.cloudflarestorage.com`);
}

const SECURITY_HEADERS = [
  {
    key: 'Content-Security-Policy',
    value: Object.entries(cspDirectives)
      .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
      .join('; '),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: true,
  },
  images: {
    // Cloudflare Workers does not support Next.js default image optimizer; serve originals instead.
    // https://nextjs.org/docs/app/api-reference/components/image#unoptimized
    // https://opennext.js.org/cloudflare/howtos/image
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'scontent.cdninstagram.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'header',
            key: 'accept',
            value: '.*text/html.*',
          },
        ],
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-cache, no-store, must-revalidate, no-transform',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

if (parsedPublicUrl) {
  const pathname =
    parsedPublicUrl.pathname === '/' ? '/**' : `${parsedPublicUrl.pathname.replace(/\/$/, '')}/**`;
  nextConfig.images.remotePatterns.push({
    protocol: parsedPublicUrl.protocol.replace(':', ''),
    hostname: parsedPublicUrl.hostname,
    pathname,
  });
}

if (accountId && bucketName) {
  nextConfig.images.remotePatterns.push({
    protocol: 'https',
    hostname: `${accountId}.r2.cloudflarestorage.com`,
    pathname: `/${bucketName}/**`,
  });
}

module.exports = nextConfig;
