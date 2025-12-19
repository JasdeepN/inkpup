#!/usr/bin/env node
import { connect } from "@dagger.io/dagger";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    source: { type: "string", default: "." },
    "run-e2e": { type: "boolean", default: false },
    deploy: { type: "boolean", default: false },
    "cloudflare-token": { type: "string" },
    "account-id": { type: "string" },
    "wrangler-env": { type: "string", default: "dev" }
  },
  allowPositionals: true
});

const runE2E = Boolean(values["run-e2e"]);
const deploy = Boolean(values.deploy);
const sourcePath = values.source || ".";
const cloudflareToken = values["cloudflare-token"];
const accountId = values["account-id"];
const wranglerEnv = values["wrangler-env"] || "dev";

const excludes = [
  "node_modules",
  ".git",
  "coverage",
  "playwright-report",
  "test-results",
  "build",
  ".open-next",
  ".wrangler/state"
];

const log = (msg) => console.log(`[dagger-ci] ${msg}`);

const main = async () => {
  log(`Starting CI pipeline (runE2E=${runE2E}, deploy=${deploy})`);
  
  return await connect(async (client) => {
    try {
      const src = client.host().directory(sourcePath, { exclude: excludes });
    const npmCache = client.cacheVolume("npm-cache");
    const nextCache = client.cacheVolume("next-cache");

    // Test phase: npm ci + npm test
    const testCtr = client
      .container()
      .from("node:22")
      .withDirectory("/src", src)
      .withWorkdir("/src")
      .withEnvVariable("CI", "true")
      .withMountedCache("/root/.npm", npmCache)
      .withExec(["npm", "ci"])
      .withMountedCache("/src/.next/cache", nextCache)
      .withExec(["npm", "test", "--", "--forceExit"]);

    // Check test exit code
    const testExitCode = await testCtr.exitCode();
    log(`npm test completed with exit code ${testExitCode}`);
    
    if (testExitCode !== 0) {
      log("Tests failed, stopping pipeline");
      process.exit(testExitCode);
    }

    // Build phase: separate container to avoid cache conflicts
    let buildCtr = client
      .container()
      .from("node:22")
      .withDirectory("/src", src)
      .withWorkdir("/src")
      .withEnvVariable("CI", "true")
      .withMountedCache("/root/.npm", npmCache)
      .withExec(["npm", "ci"])
      // Note: NOT caching .open-next since it needs fresh build each time
      .withExec(["npm", "run", "opennext:build"]);

    if (runE2E) {
      buildCtr = buildCtr
        .withExec(["npx", "playwright", "install", "--with-deps"])
        .withExec(["npm", "run", "test:e2e"]);
    }

    if (deploy) {
      if (!cloudflareToken) {
        throw new Error("deploy=true requires --cloudflare-token");
      }
      buildCtr = buildCtr
        .withSecretVariable("CLOUDFLARE_API_TOKEN", client.setSecret("CLOUDFLARE_API_TOKEN", cloudflareToken))
        .withEnvVariable("ACCOUNT_ID", accountId || "")
        .withExec(["npx", "wrangler", "deploy", "--env", wranglerEnv]);
    }

    const buildExitCode = await buildCtr.exitCode();
    log(`Pipeline completed with exit code ${buildExitCode}`);
    process.exit(buildExitCode);
    } catch (err) {
      console.error(`[dagger-ci] Error:`, err);
      process.exit(1);
    }
  });
};

main();
