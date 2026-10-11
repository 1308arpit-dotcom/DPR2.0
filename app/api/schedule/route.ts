import { NextResponse } from "next/server";
import { fetchScheduleEntries } from "@/lib/google-sheets";

export async function GET() {
  try {
    const items = await fetchScheduleEntries();
    return NextResponse.json({ success: true, items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load schedule entries.";
    return NextResponse.json({ success: false, message, items: [] }, { status: 500 });
  }
}
