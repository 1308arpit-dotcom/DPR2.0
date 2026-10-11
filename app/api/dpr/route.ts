import { NextRequest, NextResponse } from "next/server";
import { fetchDprEntries, recordDpr } from "@/lib/google-sheets";

export async function GET() {
  try {
    const items = await fetchDprEntries();
    return NextResponse.json({ success: true, items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load DPR data.";
    return NextResponse.json({ success: false, message, items: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    const lineCode = String(payload.lineCode ?? "").trim();
    const itemDescription = String(payload.itemDescription ?? "").trim();
    const actualQty = String(payload.actualQty ?? "").trim();
    const manpower = String(payload.manpower ?? "").trim();
    const dateOfDpr = String(payload.dateOfDpr ?? payload.date ?? "").trim();
    const remark = String(payload.remark ?? payload.remarks ?? "").trim();
    const enteredBy = String(payload.enteredBy ?? payload.submittedBy ?? "Site Engineer").trim();
    const uploadDocument = String(payload.uploadDocument ?? "").trim();
    const planQty = String(payload.planQty ?? "").trim();

    if (!lineCode || !itemDescription || !dateOfDpr) {
      return NextResponse.json(
        { success: false, message: "Line Code, Item Description, and Date Of DPR are required." },
        { status: 400 }
      );
    }

    const savedRow = await recordDpr({
      lineCode,
      itemDescription,
      actualQty,
      manpower,
      dateOfDpr,
      remark,
      enteredBy,
      uploadDocument,
      planQty,
    });

    return NextResponse.json({ success: true, item: savedRow });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save DPR entry.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
