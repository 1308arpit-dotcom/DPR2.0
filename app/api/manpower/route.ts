import { NextRequest, NextResponse } from "next/server";
import { fetchMachineryEntries, recordMachineryInput } from "@/lib/google-sheets";

export async function GET() {
  try {
    const items = await fetchMachineryEntries();
    return NextResponse.json({ success: true, items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load manpower/machinery data.";
    return NextResponse.json({ success: false, message, items: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    const date = String(payload.date ?? "").trim();
    const jobCardNo = String(payload.jobCardNo ?? payload.contractorName ?? "").trim();
    const tCode = String(payload.tCode ?? payload.category ?? "").trim();
    const itemDescription = String(payload.itemDescription ?? payload.resourceName ?? "").trim();
    const currentActual = String(payload.currentActual ?? payload.quantity ?? "0").trim();
    const planQty = String(payload.planQty ?? "").trim();
    const remark = String(payload.remark ?? payload.remarks ?? "").trim();

    if (!date || !jobCardNo || !tCode || !itemDescription) {
      return NextResponse.json(
        { success: false, message: "Date, Job Card No, T-Code, and Description are required." },
        { status: 400 }
      );
    }

    const saved = await recordMachineryInput({
      date,
      jobCardNo,
      tCode,
      itemDescription,
      currentActual,
      planQty,
      remark,
    });

    return NextResponse.json({ success: true, item: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save machinery/manpower entry.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
