/**
 * Batch generate DALL-E kawaii mug avatars for all mugs without images.
 *
 * Usage:
 *   cd muglife
 *   export $(grep -v '^#' .env.local | grep '=' | xargs)
 *   npx tsx scripts/generate-avatars.ts
 *
 * Options:
 *   --dry-run    Show what would be generated without calling APIs
 *   --force      Regenerate all avatars even if they already have images
 *   --limit N    Only generate N avatars (useful for testing)
 */

import { neon } from "@neondatabase/serverless";
import OpenAI from "openai";
import { put } from "@vercel/blob";

const sql = neon(process.env.DATABASE_URL!);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const FORCE = args.includes("--force");
const limitIdx = args.indexOf("--limit");
const LIMIT = limitIdx >= 0 ? parseInt(args[limitIdx + 1]) : Infinity;

const DELAY_MS = 5000; // 5 seconds between DALL-E calls to avoid rate limiting

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log(
    `Avatar Generator ${DRY_RUN ? "(DRY RUN)" : ""} ${FORCE ? "(FORCE)" : ""}`
  );

  // Get mugs that need avatars
  const mugs = FORCE
    ? await sql`SELECT id, name, physical_description FROM mugs ORDER BY id`
    : await sql`SELECT id, name, physical_description FROM mugs WHERE image_url IS NULL OR image_url = '' ORDER BY id`;

  console.log(`Found ${mugs.length} mugs needing avatars.\n`);

  let generated = 0;

  for (const mug of mugs) {
    if (generated >= LIMIT) {
      console.log(`Reached limit of ${LIMIT}. Stopping.`);
      break;
    }

    const { id, name, physical_description } = mug as {
      id: number;
      name: string;
      physical_description: string | null;
    };

    if (!physical_description) {
      console.log(`  [SKIP] ${name} (id:${id}) — no physical description`);
      continue;
    }

    console.log(`  [${generated + 1}] Generating avatar for ${name} (id:${id})...`);

    if (DRY_RUN) {
      console.log(`    Would generate: ${physical_description.slice(0, 80)}...`);
      generated++;
      continue;
    }

    try {
      const imageRes = await openai.images.generate({
        model: "dall-e-3",
        prompt: `Kawaii ceramic coffee mug character illustration. ${physical_description}. The mug has cute cartoon features: two wide-set dot eyes in lower third of body, small mouth, pink blush ovals on cheeks. Thin black noodle arms and legs (1930s rubber-hose animation style). Satin-matte glaze finish. Warm earthy background. Storybook illustration style, Adventure Time meets Animal Crossing aesthetic. Single character centered, white/clean background.`,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });

      const dalleUrl = imageRes.data?.[0]?.url;
      if (!dalleUrl) {
        console.log(`    [ERROR] No URL returned from DALL-E`);
        continue;
      }

      // Download and upload to Vercel Blob
      const imgResponse = await fetch(dalleUrl);
      const imgBlob = await imgResponse.blob();
      const filename = `mugs/${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${id}.png`;

      try {
        const blob = await put(filename, imgBlob, {
          access: "public",
          contentType: "image/png",
        });

        // Update DB with permanent blob URL
        await sql`
          UPDATE mugs SET image_url = ${blob.url}, chat_image_url = ${blob.url}
          WHERE id = ${id}
        `;

        console.log(`    [OK] ${blob.url}`);
      } catch (blobErr) {
        // Fallback: use DALL-E URL directly (expires in 1hr)
        await sql`
          UPDATE mugs SET image_url = ${dalleUrl}, chat_image_url = ${dalleUrl}
          WHERE id = ${id}
        `;
        console.log(`    [WARN] Blob upload failed, using DALL-E URL (expires in 1hr)`);
      }

      generated++;

      // Rate limit delay
      if (generated < mugs.length && generated < LIMIT) {
        console.log(`    Waiting ${DELAY_MS / 1000}s...`);
        await sleep(DELAY_MS);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`    [ERROR] ${message}`);
      // Continue with other mugs
      await sleep(DELAY_MS);
    }
  }

  console.log(`\nDone! Generated ${generated} avatars.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
