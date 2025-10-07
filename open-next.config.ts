// TypeScript OpenNext config for CI (Cloudflare adapter)
// Mirrors the CommonJS config to satisfy CLI filename expectations.
export default {
  default: {
    // where OpenNext will write worker and assets
    output: '.open-next',
    // Cloudflare adapter package
    adapter: '@opennextjs/cloudflare',
    // allow overriding project name via env in CI
    project: process.env.CLOUDFLARE_PROJECT_NAME || undefined,
    // adapter/runtime overrides required by the Cloudflare adapter
    override: {
      wrapper: 'cloudflare-node',
      converter: 'edge',
      proxyExternalRequest: 'fetch',
      incrementalCache: 'dummy',
      tagCache: 'dummy',
      queue: 'dummy',
    },
  },
  // ensure node:crypto is externalized in edge builds
  edgeExternals: ['node:crypto'],
  // middleware should be external and have cloudflare-edge overrides
  middleware: {
    external: true,
    override: {
      wrapper: 'cloudflare-edge',
      converter: 'edge',
      proxyExternalRequest: 'fetch',
      incrementalCache: 'dummy',
      tagCache: 'dummy',
      queue: 'dummy',
    },
  },
};
