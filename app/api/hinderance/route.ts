import { NextRequest, NextResponse } from "next/server";
import { fetchHindranceEntries, recordHindrance } from "@/lib/google-sheets";

export async function GET() {
  try {
    const items = await fetchHindranceEntries();
    return NextResponse.json({ success: true, items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load hindrance data.";
    return NextResponse.json({ success: false, message, items: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    const jobCardNo = String(payload.jobCardNo ?? payload.jobCardNumber ?? "").trim();
    const startDate = String(payload.startDate ?? payload.date ?? "").trim();
    const selectHindrance = String(payload.selectHindrance ?? payload.category ?? "").trim();
    const remark = String(payload.remark ?? payload.remarks ?? "").trim();
    const enteredBy = String(payload.enteredBy ?? payload.submittedBy ?? "Site Engineer").trim();
    const uploadDocument = String(payload.uploadDocument ?? payload.documentName ?? "").trim();

    if (!jobCardNo || !startDate || !selectHindrance || !remark) {
      return NextResponse.json(
        { success: false, message: "Job Card, Start Date, Hindrance, and Remark are required." },
        { status: 400 }
      );
    }

    const saved = await recordHindrance({
      jobCardNo,
      startDate,
      selectHindrance,
      remark,
      enteredBy,
      uploadDocument,
    });

    return NextResponse.json({ success: true, item: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save hindrance entry.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
