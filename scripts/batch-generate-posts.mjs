#!/usr/bin/env node
/**
 * batch-generate-posts.mjs — 블로그 포스트 일괄 생성 (1회성)
 * ─────────────────────────────────────────────────
 * AdSense 승인을 위해 15-20개의 포스트를 한 번에 생성합니다.
 * generate-post.mjs 의 main() 로직을 반복 실행합니다.
 *
 * Run: GROQ_API_KEY=xxx NOTION_TOKEN=xxx NOTION_DATABASE_ID=xxx node scripts/batch-generate-posts.mjs
 */

import { execFileSync } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GENERATE_SCRIPT = resolve(__dirname, "generate-post.mjs");

const TARGET_COUNT = parseInt(process.env.BATCH_COUNT || "20", 10);
const DELAY_BETWEEN_MS = 15000; // 15 seconds between posts (rate limit safety)

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log("═══════════════════════════════════════");
  console.log("  📦 Batch Post Generator");
  console.log(`  Target: ${TARGET_COUNT} posts`);
  console.log(`  Delay: ${DELAY_BETWEEN_MS / 1000}s between posts`);
  console.log("═══════════════════════════════════════\n");

  let success = 0;
  let failed = 0;

  for (let i = 1; i <= TARGET_COUNT; i++) {
    console.log(`\n${"─".repeat(40)}`);
    console.log(`📝 Post ${i}/${TARGET_COUNT}`);
    console.log(`${"─".repeat(40)}`);

    try {
      execFileSync("node", [GENERATE_SCRIPT], {
        env: process.env,
        stdio: "inherit",
        timeout: 120000, // 2 min per post
      });
      success++;
      console.log(`✅ Post ${i} complete (${success} success, ${failed} failed)`);
    } catch (err) {
      failed++;
      console.error(`❌ Post ${i} failed: ${err.message}`);
    }

    // Wait between posts (except after last)
    if (i < TARGET_COUNT) {
      console.log(`\n⏳ Waiting ${DELAY_BETWEEN_MS / 1000}s before next post...`);
      await sleep(DELAY_BETWEEN_MS);
    }
  }

  console.log("\n═══════════════════════════════════════");
  console.log(`  📦 Batch Complete!`);
  console.log(`  ✅ Success: ${success}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  📊 Total: ${success + failed}/${TARGET_COUNT}`);
  console.log("═══════════════════════════════════════");
}

main().catch(err => {
  console.error("❌ Batch generation failed:", err.message);
});
