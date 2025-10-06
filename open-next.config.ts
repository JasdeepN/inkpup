// Minimal OpenNext config to allow non-interactive builds in CI
// Points OpenNext at the Cloudflare adapter and sets the output directory
export default {
  // where OpenNext will write worker and assets
  output: '.open-next',
  // use the Cloudflare adapter package
  adapter: '@opennextjs/cloudflare',
  // allow overriding project name via env in CI
  project: process.env.CLOUDFLARE_PROJECT_NAME || undefined,
};
