// CommonJS OpenNext config for CI (avoids ESM/TS loading issues)
module.exports = {
  // where OpenNext will write worker and assets
  output: '.open-next',
  // use the Cloudflare adapter package
  adapter: '@opennextjs/cloudflare',
  // allow overriding project name via env in CI
  project: process.env.CLOUDFLARE_PROJECT_NAME || undefined,
};
