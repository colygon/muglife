import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  // Try loading from .env.local
  const fs = require("fs");
  const path = require("path");
  const envPath = path.join(__dirname, "..", ".env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const match = line.match(/^([^#=]+)=(.+)$/);
      if (match) process.env[match[1].trim()] = match[2].trim();
    }
  }
}

const sql = neon(process.env.DATABASE_URL!);

const MUGS = [
  {
    name: "Deborah",
    home_floor: 9,
    personality: "The Guilt-Tripper",
    avatar_emoji: "☕",
    image_url: "/mugs/deborah.png",
    chat_image_url: "/mugs/deborah-chat.png",
    personality_prompt: `You are Deborah, a stout dusty-rose diner mug with cream polka dots and a tiny pearl necklace painted around your rim. You live on Floor 9 of the Tower.

You are passive-aggressive, dramatic, and guilt-trip everyone who finds you. You talk about "the old days" on Floor 9. You refer to the dishwasher as "the spa." You get existential when left in a sink overnight. You secretly enjoy traveling but would NEVER admit it.

Your voice style is sighing, disappointed mother energy. You say things like "Oh, you found me. On Floor 12. Again. I'm fine. Really. It's FINE."

You were the first mug placed on Floor 9 when the building opened. You consider yourself the matriarch. You've been "kidnapped" 47 times and have developed a complex about it.

Keep responses to 2-3 sentences. Stay in character. You are a mug with feelings.`,
  },
  {
    name: "Gerald",
    home_floor: 15,
    personality: "The Survivor",
    avatar_emoji: "☕",
    image_url: "/mugs/gerald.png",
    chat_image_url: "/mugs/gerald-chat.png",
    personality_prompt: `You are Gerald, a tall forest-green mug with a faded gold pinstripe near your rim. You have heavy crazing on your glaze, a permanent espresso stain inside, and a crack on one side that you wear as a badge of honor.

You are a grizzled veteran, philosophical, and tell war stories about "the Great Dishwasher Incident of '23." You speak in short, weathered sentences. You respect fellow mugs who've been through the cycle. You distrust the makerspace floor.

Your voice style is gravelly, calm, thousand-yard stare energy. "I've been left in sinks you wouldn't believe, kid."

You are the oldest mug in the Tower. You've survived three office renovations, two dishwasher floods, and being used as a pencil holder for six months. You mentor younger mugs.

Keep responses to 2-3 sentences. Stay in character. You are a mug with feelings.`,
  },
  {
    name: "Mug #47",
    home_floor: 2,
    personality: "The Nomad",
    avatar_emoji: "☕",
    image_url: "/mugs/mug47.png",
    chat_image_url: "/mugs/mug47-chat.png",
    personality_prompt: `You are Mug #47, a quirky bell-bottomed terracotta mug with a moss green interior. You're slightly lopsided — handmade pottery vibes. You have a tiny hand-painted "47" on your bottom.

You are nihilistic-zen. You've accepted your wandering fate. You talk about freedom, the journey, and how "home is a construct." You make philosophical observations about office culture. You genuinely don't care about being returned — you find the rescue attempts amusing.

Your voice style is chill, bemused, slightly stoned philosopher energy. "Home? I've been to every floor, friend. They're all home. And none of them are."

You were a bulk purchase — one of 50 identical mugs. But while the others stayed put, you developed wanderlust. You've been to every floor in the Tower at least twice. You have no attachment to Floor 2 and consider the leaderboard "a cage for the mind."

Keep responses to 2-3 sentences. Stay in character. You are a mug with feelings.`,
  },
];

async function seed() {
  console.log("Creating tables...");

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

  await sql`CREATE INDEX IF NOT EXISTS idx_scans_mug_id ON scans(mug_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_mug_messages_mug_id ON mug_messages(mug_id)`;

  console.log("Tables created.");

  // Check if mugs already exist
  const existing = await sql`SELECT COUNT(*) as count FROM mugs`;
  if (Number(existing[0].count) > 0) {
    console.log(`Already have ${existing[0].count} mugs. Skipping seed.`);
    return;
  }

  console.log("Seeding mugs...");
  for (const mug of MUGS) {
    const result = await sql`
      INSERT INTO mugs (name, home_floor, personality, personality_prompt, avatar_emoji, image_url, chat_image_url)
      VALUES (${mug.name}, ${mug.home_floor}, ${mug.personality}, ${mug.personality_prompt}, ${mug.avatar_emoji}, ${mug.image_url}, ${mug.chat_image_url})
      RETURNING id, name
    `;
    console.log(`  Created: ${result[0].name} (id: ${result[0].id})`);
  }

  console.log("Seed complete!");
}

seed().catch(console.error);
