// Writes this deployment's wrangler.jsonc and deploy-targets.json the way `npm run init` does,
// for an install provisioned with the shared API token instead of init's wrangler login.
import { writeFileSync } from "node:fs";
import path from "node:path";
import { initConfig } from "./init-config.ts";

const root = path.join(import.meta.dirname, "..");
const d = {
  slug: "blyg-tejas-nyc",
  accountId: "cfd742252a6dc223dbd07a8b8cd8e5ac",
  host: "blyg.tejas.nyc",
  databaseName: "blyg-blyg-tejas-nyc",
  databaseId: "dcb6726e-0dce-4fe1-8f67-9506bf20bdf1",
  bucketName: "blyg-blyg-tejas-nyc-media",
};
writeFileSync(path.join(root, "wrangler.jsonc"), initConfig(d));
writeFileSync(path.join(root, "deploy-targets.json"), `${JSON.stringify({
  targets: [{
    env: "", label: `My blyg at ${d.host}`, worker: `blyg-${d.slug}`,
    account_id: d.accountId, account_label: "Tejas Account", base: `https://${d.host}/`,
    credentials: { registry: "Cloudflare Worker secrets (wrangler secret put)", worker_secrets: ["OWNER_PASSWORD", "COOKIE_SECRET"] },
    verify: [
      { path: "blyg.json", status: 200, contains: '"blyg"' },
      { path: "feed.xml", status: 200, contains: "<rss" },
      { path: "items/index.json", status: 200 },
    ],
  }],
}, null, 2)}\n`);
console.log("wrote wrangler.jsonc and deploy-targets.json");
