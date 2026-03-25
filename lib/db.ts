import { neon } from "@neondatabase/serverless";

export const sql = neon(process.env.DATABASE_URL!);

let schemaReady = false;

export async function ensureSchema() {
  if (schemaReady) return;

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

  // Indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_scans_mug_id ON scans(mug_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_mug_messages_mug_id ON mug_messages(mug_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_selfies_mug_id ON selfies(mug_id)`;

  schemaReady = true;
}
