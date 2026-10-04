import { NextRequest, NextResponse } from "next/server";

import { fetchScheduleEntries, upsertScheduleEntry, validateScheduleEntry } from "@/lib/google-sheets";

export async function GET() {
  try {
    const items = await fetchScheduleEntries();

    return NextResponse.json({
      success: true,
      items,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load schedule entries.";

    return NextResponse.json(
      {
        success: false,
        message,
        items: [],
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const verifiedEntry = validateScheduleEntry(payload);
    const item = await upsertScheduleEntry(verifiedEntry);

    return NextResponse.json({
      success: true,
      item,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save schedule entry.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 400 },
    );
  }
}
