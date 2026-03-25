import { neon } from "@neondatabase/serverless";
import { MUG_ROSTER } from "./mug-roster";
import * as fs from "fs";
import * as path from "path";

// Load .env.local if DATABASE_URL not set
if (!process.env.DATABASE_URL) {
  const envPath = path.resolve(import.meta.dirname || ".", "..", ".env.local");
  try {
    const envPath2 = fs.existsSync(envPath)
      ? envPath
      : path.resolve(".", ".env.local");
    const envContent = fs.readFileSync(envPath2, "utf-8");
    for (const line of envContent.split("\n")) {
      const match = line.match(/^([^#=]+)=(.+)$/);
      if (match) process.env[match[1].trim()] = match[2].trim();
    }
  } catch {
    // Try CWD
    try {
      const envContent = fs.readFileSync(".env.local", "utf-8");
      for (const line of envContent.split("\n")) {
        const match = line.match(/^([^#=]+)=(.+)$/);
        if (match) process.env[match[1].trim()] = match[2].trim();
      }
    } catch {
      console.error("No .env.local found and DATABASE_URL not set");
      process.exit(1);
    }
  }
}

const sql = neon(process.env.DATABASE_URL!);

async function seed() {
  console.log("Ensuring schema...");

  // Create tables
  await sql`
    CREATE TABLE IF NOT EXISTS mugs (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      home_floor INT NOT NULL,
      personality TEXT NOT NULL,
      personality_prompt TEXT NOT NULL,
      avatar_emoji TEXT DEFAULT '☕',
      image_url TEXT,
      chat_image_url TEXT,
      voice_id TEXT,
      voice_intro_text TEXT,
      faction TEXT,
      level INT DEFAULT 1,
      physical_description TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS scans (
      id SERIAL PRIMARY KEY,
      mug_id INT NOT NULL REFERENCES mugs(id),
      floor INT NOT NULL,
      scanner_name TEXT DEFAULT 'Anonymous',
      is_rescue BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS mug_messages (
      id SERIAL PRIMARY KEY,
      mug_id INT NOT NULL REFERENCES mugs(id),
      author TEXT DEFAULT 'Anonymous',
      message TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS selfies (
      id SERIAL PRIMARY KEY,
      mug_id INT NOT NULL REFERENCES mugs(id),
      image_url TEXT NOT NULL,
      author TEXT DEFAULT 'Anonymous',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      type TEXT NOT NULL,
      mug_id INT REFERENCES mugs(id),
      actor TEXT DEFAULT 'Anonymous',
      detail TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  // Add new columns (safe to run multiple times)
  await sql`ALTER TABLE mugs ADD COLUMN IF NOT EXISTS voice_intro_text TEXT`;
  await sql`ALTER TABLE mugs ADD COLUMN IF NOT EXISTS faction TEXT`;
  await sql`ALTER TABLE mugs ADD COLUMN IF NOT EXISTS level INT DEFAULT 1`;
  await sql`ALTER TABLE mugs ADD COLUMN IF NOT EXISTS physical_description TEXT`;

  // Indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_scans_mug_id ON scans(mug_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_mug_messages_mug_id ON mug_messages(mug_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_selfies_mug_id ON selfies(mug_id)`;

  console.log("Schema ready.");

  // Upsert all mugs from roster
  console.log(`Seeding ${MUG_ROSTER.length} mugs...`);

  for (const mug of MUG_ROSTER) {
    // Check if mug already exists by name
    const existing = await sql`SELECT id FROM mugs WHERE name = ${mug.name}`;

    if (existing.length > 0) {
      // Update existing mug with new data (preserve image_url)
      await sql`
        UPDATE mugs SET
          home_floor = ${mug.home_floor},
          personality = ${mug.personality},
          personality_prompt = ${mug.personality_prompt},
          avatar_emoji = ${mug.avatar_emoji},
          voice_id = ${mug.voice_id},
          voice_intro_text = ${mug.voice_intro_text},
          faction = ${mug.faction},
          physical_description = ${mug.physical_description}
        WHERE name = ${mug.name}
      `;
      console.log(`  Updated: ${mug.name} (id: ${existing[0].id})`);
    } else {
      // Insert new mug
      const result = await sql`
        INSERT INTO mugs (name, home_floor, personality, personality_prompt, avatar_emoji, voice_id, voice_intro_text, faction, physical_description)
        VALUES (${mug.name}, ${mug.home_floor}, ${mug.personality}, ${mug.personality_prompt}, ${mug.avatar_emoji}, ${mug.voice_id}, ${mug.voice_intro_text}, ${mug.faction}, ${mug.physical_description})
        RETURNING id, name
      `;
      console.log(`  Created: ${result[0].name} (id: ${result[0].id})`);
    }
  }

  // Verify count
  const count = await sql`SELECT COUNT(*) as count FROM mugs`;
  console.log(`\nSeed complete! Total mugs: ${count[0].count}`);
}

seed().catch(console.error);
