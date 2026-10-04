import { NextRequest, NextResponse } from "next/server";

import { appendSheetRow, readSheetRows } from "@/lib/google-sheets";

const DPR_HEADERS = [
  "date",
  "jobCardNumber",
  "activityDescription",
  "quantityExecuted",
  "laborCount",
  "remarks",
  "submittedBy",
] as const;

export async function GET() {
  try {
    const items = await readSheetRows("DPR", DPR_HEADERS);
    return NextResponse.json({ success: true, items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load DPR data.";
    return NextResponse.json({ success: false, message, items: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const row = {
      date: String(payload.date ?? ""),
      jobCardNumber: String(payload.jobCardNumber ?? ""),
      activityDescription: String(payload.activityDescription ?? ""),
      quantityExecuted: String(payload.quantityExecuted ?? ""),
      laborCount: String(payload.laborCount ?? ""),
      remarks: String(payload.remarks ?? ""),
      submittedBy: String(payload.submittedBy ?? ""),
    };

    if (!row.date || !row.jobCardNumber || !row.activityDescription) {
      return NextResponse.json(
        { success: false, message: "Date, job card, and activity description are required." },
        { status: 400 },
      );
    }

    const values = await appendSheetRow("DPR", DPR_HEADERS, row);
    return NextResponse.json({ success: true, item: Object.fromEntries(DPR_HEADERS.map((header, index) => [header, values[index] ?? ""])), row });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save DPR entry.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
