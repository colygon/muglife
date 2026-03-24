import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

const GOOGLE_SHEET_URL =
  "https://script.google.com/macros/s/AKfycbwbhCK21OKTBMiuUotztJRECS2lSEjWZeY5OIZBKjnfyn4fR4ZDL532pT92IR4fHUFkSQ/exec";

// Auto-create the table on first request
let tableCreated = false;

async function ensureTable() {
  if (tableCreated) return;
  await sql`
    CREATE TABLE IF NOT EXISTS signups (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      telegram TEXT DEFAULT '',
      suggestion TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  tableCreated = true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, telegram, suggestion } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    await ensureTable();

    const cleanData = {
      name: name.trim(),
      email: email.trim(),
      telegram: (telegram || "").trim().replace(/^@/, ""),
      suggestion: (suggestion || "").trim(),
    };

    // Write to Postgres and Google Sheet in parallel
    await Promise.all([
      sql`
        INSERT INTO signups (name, email, telegram, suggestion)
        VALUES (${cleanData.name}, ${cleanData.email}, ${cleanData.telegram}, ${cleanData.suggestion})
      `,
      fetch(GOOGLE_SHEET_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanData),
      }).catch((err) => console.error("Google Sheet write failed:", err)),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Failed to save signup" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await ensureTable();
    const signups = await sql`SELECT * FROM signups ORDER BY created_at DESC`;
    return NextResponse.json({ count: signups.length, signups });
  } catch (error) {
    console.error("Error reading signups:", error);
    return NextResponse.json(
      { error: "Failed to read signups" },
      { status: 500 }
    );
  }
}
