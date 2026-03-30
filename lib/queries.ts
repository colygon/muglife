import { sql, ensureSchema } from "./db";
import type { Mug, MugProfile, Scan, MugMessage, Selfie, ActivityEntry, MugOnFloor, EventType, AppEvent } from "./types";

export async function getMugById(id: number): Promise<Mug | null> {
  await ensureSchema();
  const rows = await sql`SELECT * FROM mugs WHERE id = ${id}`;
  return (rows[0] as Mug) || null;
}

export async function getMugProfile(id: number): Promise<MugProfile | null> {
  await ensureSchema();

  const mugRows = await sql`
    SELECT m.*,
      (SELECT floor FROM scans WHERE mug_id = m.id ORDER BY created_at DESC LIMIT 1) as current_floor,
      (SELECT created_at FROM scans WHERE mug_id = m.id ORDER BY created_at DESC LIMIT 1) as last_seen,
      (SELECT COUNT(*) FROM scans WHERE mug_id = m.id)::int as total_scans
    FROM mugs m WHERE m.id = ${id}
  `;

  if (!mugRows[0]) return null;

  const mug = mugRows[0] as Mug & {
    current_floor: number | null;
    last_seen: string | null;
    total_scans: number;
  };

  const [recentScans, recentMessages, selfies] = await Promise.all([
    sql`SELECT * FROM scans WHERE mug_id = ${id} ORDER BY created_at DESC LIMIT 20`,
    sql`SELECT * FROM mug_messages WHERE mug_id = ${id} ORDER BY created_at DESC LIMIT 10`,
    sql`SELECT * FROM selfies WHERE mug_id = ${id} ORDER BY created_at DESC LIMIT 20`.catch(() => []),
  ]);

  // Calculate days away from home
  const lastHomeVisit = await sql`
    SELECT created_at FROM scans
    WHERE mug_id = ${id} AND floor = ${mug.home_floor}
    ORDER BY created_at DESC LIMIT 1
  `;

  let daysAway = 0;
  if (lastHomeVisit[0]) {
    daysAway = Math.floor(
      (Date.now() - new Date(lastHomeVisit[0].created_at as string).getTime()) /
        (1000 * 60 * 60 * 24)
    );
  } else if (mug.total_scans > 0) {
    // Has scans but never been home
    daysAway = Math.floor(
      (Date.now() - new Date(mug.created_at).getTime()) /
        (1000 * 60 * 60 * 24)
    );
  }

  return {
    ...mug,
    days_away: daysAway,
    recent_scans: recentScans as Scan[],
    recent_messages: recentMessages as MugMessage[],
    selfies: selfies as Selfie[],
  };
}

export async function logScan(
  mugId: number,
  floor: number,
  scannerName: string = "Anonymous",
  isRescue: boolean = false
): Promise<Scan> {
  await ensureSchema();
  const rows = await sql`
    INSERT INTO scans (mug_id, floor, scanner_name, is_rescue)
    VALUES (${mugId}, ${floor}, ${scannerName}, ${isRescue})
    RETURNING *
  `;
  return rows[0] as Scan;
}

export async function leaveMessage(
  mugId: number,
  author: string = "Anonymous",
  message: string
): Promise<MugMessage> {
  await ensureSchema();
  const rows = await sql`
    INSERT INTO mug_messages (mug_id, author, message)
    VALUES (${mugId}, ${author}, ${message})
    RETURNING *
  `;
  return rows[0] as MugMessage;
}

export async function getRecentActivity(limit: number = 30): Promise<ActivityEntry[]> {
  await ensureSchema();
  const rows = await sql`
    SELECT s.id, s.mug_id, s.floor, s.scanner_name, s.is_rescue, s.created_at,
      m.name as mug_name, m.home_floor as mug_home_floor,
      m.personality as mug_personality, m.avatar_emoji as mug_avatar_emoji,
      m.image_url as mug_image_url
    FROM scans s
    JOIN mugs m ON m.id = s.mug_id
    ORDER BY s.created_at DESC
    LIMIT ${limit}
  `;
  return rows as ActivityEntry[];
}

export async function getMugsByCurrentFloor(): Promise<MugOnFloor[]> {
  await ensureSchema();
  const rows = await sql`
    SELECT DISTINCT ON (m.id)
      m.id, m.name, m.home_floor, m.avatar_emoji, m.image_url,
      s.floor as current_floor
    FROM mugs m
    LEFT JOIN scans s ON s.mug_id = m.id
    ORDER BY m.id, s.created_at DESC
  `;
  return rows as MugOnFloor[];
}

export async function logEvent(
  type: EventType,
  mugId: number | null,
  actor: string = "Anonymous",
  detail: string | null = null
): Promise<void> {
  await ensureSchema();
  await sql`
    INSERT INTO events (type, mug_id, actor, detail)
    VALUES (${type}, ${mugId}, ${actor}, ${detail})
  `;
}

export async function getEvents(limit: number = 100): Promise<AppEvent[]> {
  await ensureSchema();
  const rows = await sql`
    SELECT e.*, m.name as mug_name, m.avatar_emoji as mug_avatar_emoji, m.image_url as mug_image_url,
      s.image_url as selfie_image_url
    FROM events e
    LEFT JOIN mugs m ON m.id = e.mug_id
    LEFT JOIN LATERAL (
      SELECT image_url FROM selfies
      WHERE selfies.mug_id = e.mug_id
        AND selfies.created_at <= e.created_at + interval '60 seconds'
        AND selfies.created_at >= e.created_at - interval '60 seconds'
      ORDER BY selfies.created_at DESC
      LIMIT 1
    ) s ON e.type = 'selfie'
    ORDER BY e.created_at DESC
    LIMIT ${limit}
  `;
  return rows as AppEvent[];
}

export async function saveSelfie(
  mugId: number,
  imageUrl: string,
  author: string = "Anonymous"
): Promise<Selfie> {
  await ensureSchema();
  const rows = await sql`
    INSERT INTO selfies (mug_id, image_url, author)
    VALUES (${mugId}, ${imageUrl}, ${author})
    RETURNING *
  `;
  return rows[0] as Selfie;
}

export async function getAllMugs(): Promise<
  (Mug & { current_floor: number | null; total_scans: number })[]
> {
  await ensureSchema();
  const rows = await sql`
    SELECT m.*,
      (SELECT floor FROM scans WHERE mug_id = m.id ORDER BY created_at DESC LIMIT 1) as current_floor,
      (SELECT COUNT(*) FROM scans WHERE mug_id = m.id)::int as total_scans
    FROM mugs m ORDER BY m.id
  `;
  return rows as (Mug & { current_floor: number | null; total_scans: number })[];
}

export async function createMug(data: {
  name: string;
  home_floor: number;
  personality: string;
  personality_prompt: string;
  avatar_emoji?: string;
  image_url?: string;
  chat_image_url?: string;
}): Promise<Mug> {
  await ensureSchema();
  const rows = await sql`
    INSERT INTO mugs (name, home_floor, personality, personality_prompt, avatar_emoji, image_url, chat_image_url)
    VALUES (
      ${data.name},
      ${data.home_floor},
      ${data.personality},
      ${data.personality_prompt},
      ${data.avatar_emoji || "☕"},
      ${data.image_url || null},
      ${data.chat_image_url || null}
    )
    RETURNING *
  `;
  return rows[0] as Mug;
}
