import { NextRequest, NextResponse } from "next/server";

import { appendSheetRow, readSheetRows } from "@/lib/google-sheets";

const MANPOWER_HEADERS = [
  "date",
  "contractorName",
  "category",
  "resourceName",
  "quantity",
  "shift",
  "remarks",
  "submittedBy",
] as const;

export async function GET() {
  try {
    const items = await readSheetRows("Manpower", MANPOWER_HEADERS);
    return NextResponse.json({ success: true, items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load manpower data.";
    return NextResponse.json({ success: false, message, items: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const row = {
      date: String(payload.date ?? ""),
      contractorName: String(payload.contractorName ?? ""),
      category: String(payload.category ?? ""),
      resourceName: String(payload.resourceName ?? ""),
      quantity: String(payload.quantity ?? ""),
      shift: String(payload.shift ?? ""),
      remarks: String(payload.remarks ?? ""),
      submittedBy: String(payload.submittedBy ?? ""),
    };

    if (!row.date || !row.contractorName || !row.category || !row.resourceName) {
      return NextResponse.json(
        { success: false, message: "Date, contractor, category, and resource are required." },
        { status: 400 },
      );
    }

    const values = await appendSheetRow("Manpower", MANPOWER_HEADERS, row);
    return NextResponse.json({ success: true, item: Object.fromEntries(MANPOWER_HEADERS.map((header, index) => [header, values[index] ?? ""])), row });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save manpower entry.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
