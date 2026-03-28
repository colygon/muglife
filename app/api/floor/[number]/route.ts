import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, sql } from "@/lib/db";
import { getFloorInfo } from "@/lib/floors";

export async function GET(
  request: NextRequest,
  { params }: { params: { number: string } }
) {
  const floorNumber = parseInt(params.number);
  if (isNaN(floorNumber)) {
    return NextResponse.json({ error: "Invalid floor number" }, { status: 400 });
  }

  const floorInfo = getFloorInfo(floorNumber);
  if (!floorInfo) {
    return NextResponse.json({ error: "Floor not found" }, { status: 404 });
  }

  await ensureSchema();

  // Get mugs whose home is this floor or currently on this floor
  const mugs = await sql`
    SELECT m.id, m.name, m.personality, m.avatar_emoji, m.image_url, m.home_floor,
      (SELECT s.floor FROM scans s WHERE s.mug_id = m.id ORDER BY s.created_at DESC LIMIT 1) as current_floor,
      (SELECT COUNT(*) FROM scans s WHERE s.mug_id = m.id) as total_scans
    FROM mugs m
    WHERE m.home_floor = ${floorNumber}
    ORDER BY m.name
  `;

  // Get mugs visiting this floor (home elsewhere)
  const visitors = await sql`
    SELECT DISTINCT ON (m.id) m.id, m.name, m.personality, m.avatar_emoji, m.image_url, m.home_floor,
      ${floorNumber} as current_floor,
      (SELECT COUNT(*) FROM scans s WHERE s.mug_id = m.id) as total_scans
    FROM mugs m
    JOIN scans s ON s.mug_id = m.id
    WHERE s.floor = ${floorNumber}
      AND m.home_floor != ${floorNumber}
      AND s.created_at = (SELECT MAX(s2.created_at) FROM scans s2 WHERE s2.mug_id = m.id)
    ORDER BY m.id
  `;

  // Get recent activity on this floor
  const activity = await sql`
    SELECT e.id, e.type, e.mug_id, e.actor, e.detail, e.created_at,
      m.name as mug_name, m.avatar_emoji as mug_emoji, m.image_url as mug_image
    FROM events e
    LEFT JOIN mugs m ON e.mug_id = m.id
    WHERE e.detail LIKE ${"Floor " + floorNumber + "%"}
       OR e.detail LIKE ${"%" + floorInfo.name + "%"}
       OR e.mug_id IN (SELECT id FROM mugs WHERE home_floor = ${floorNumber})
    ORDER BY e.created_at DESC
    LIMIT 20
  `;

  // Get selfies from mugs on this floor
  const selfies = await sql`
    SELECT s.id, s.mug_id, s.image_url, s.author, s.created_at,
      m.name as mug_name
    FROM selfies s
    JOIN mugs m ON s.mug_id = m.id
    WHERE m.home_floor = ${floorNumber}
    ORDER BY s.created_at DESC
    LIMIT 20
  `;

  return NextResponse.json({
    floor: floorInfo,
    mugs,
    visitors,
    activity,
    selfies,
  });
}
