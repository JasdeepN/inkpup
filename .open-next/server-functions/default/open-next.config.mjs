var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// open-next.config.cjs
var require_open_next_config = __commonJS({
  "open-next.config.cjs"(exports, module) {
    module.exports = {
      default: {
        // where OpenNext will write worker and assets
        output: ".open-next",
        // use the Cloudflare adapter package
        adapter: "@opennextjs/cloudflare",
        // allow overriding project name via env in CI
        project: process.env.CLOUDFLARE_PROJECT_NAME || void 0,
        // adapter/runtime overrides required by the Cloudflare adapter
        override: {
          wrapper: "cloudflare-node",
          converter: "edge",
          proxyExternalRequest: "fetch",
          incrementalCache: "dummy",
          tagCache: "dummy",
          queue: "dummy"
        }
      },
      // ensure node:crypto is externalized in edge builds
      edgeExternals: ["node:crypto"],
      // middleware should be external and have cloudflare-edge overrides
      middleware: {
        external: true,
        override: {
          wrapper: "cloudflare-edge",
          converter: "edge",
          proxyExternalRequest: "fetch",
          incrementalCache: "dummy",
          tagCache: "dummy",
          queue: "dummy"
        }
      }
    };
  }
});
export default require_open_next_config();
