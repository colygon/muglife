import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "signups.json");

interface Signup {
  name: string;
  telegram: string;
  suggestion: string;
  timestamp: string;
}

async function readSignups(): Promise<Signup[]> {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeSignups(signups: Signup[]) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(signups, null, 2));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, telegram, suggestion } = body;

    if (!name || !telegram) {
      return NextResponse.json(
        { error: "Name and Telegram username are required" },
        { status: 400 }
      );
    }

    const signups = await readSignups();
    signups.push({
      name: name.trim(),
      telegram: telegram.trim().replace(/^@/, ""),
      suggestion: (suggestion || "").trim(),
      timestamp: new Date().toISOString(),
    });

    await writeSignups(signups);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to save signup" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const signups = await readSignups();
  return NextResponse.json({ count: signups.length, signups });
}
