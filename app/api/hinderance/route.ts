import { NextRequest, NextResponse } from "next/server";

import { appendSheetRow, readSheetRows } from "@/lib/google-sheets";

const HINDERANCE_HEADERS = [
  "date",
  "jobCardNumber",
  "category",
  "remarks",
  "documentName",
  "submittedBy",
] as const;

export async function GET() {
  try {
    const items = await readSheetRows("Hindrance", HINDERANCE_HEADERS);
    return NextResponse.json({ success: true, items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load hindrance data.";
    return NextResponse.json({ success: false, message, items: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const row = {
      date: String(payload.date ?? ""),
      jobCardNumber: String(payload.jobCardNumber ?? ""),
      category: String(payload.category ?? ""),
      remarks: String(payload.remarks ?? ""),
      documentName: String(payload.documentName ?? ""),
      submittedBy: String(payload.submittedBy ?? ""),
    };

    if (!row.date || !row.jobCardNumber || !row.category || !row.remarks) {
      return NextResponse.json(
        { success: false, message: "Date, job card, category, and remarks are required." },
        { status: 400 },
      );
    }

    const values = await appendSheetRow("Hindrance", HINDERANCE_HEADERS, row);
    return NextResponse.json({ success: true, item: Object.fromEntries(HINDERANCE_HEADERS.map((header, index) => [header, values[index] ?? ""])), row });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save hindrance entry.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
