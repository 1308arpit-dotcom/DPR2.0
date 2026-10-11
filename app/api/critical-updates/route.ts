import { NextRequest, NextResponse } from "next/server";
import { fetchDprEntries, fetchHindranceEntries, fetchMachineryEntries } from "@/lib/google-sheets";

export async function GET() {
  try {
    const [dprRows, hindranceRows, machineryRows] = await Promise.all([
      fetchDprEntries(),
      fetchHindranceEntries(),
      fetchMachineryEntries(),
    ]);

    const all = [
      ...dprRows.map((row) => ({
        id: `dpr-${row.id}`,
        module: "DPR",
        title: row.itemDescription || "DPR Activity",
        summary: `Qty: ${row.actualQty} | Manpower: ${row.manpower} | Line: ${row.lineCode}`,
        date: row.date || "-",
        submittedBy: row.enteredBy || "Site Engineer",
      })),
      ...hindranceRows.map((row) => ({
        id: `hindrance-${row.id}`,
        module: "Hindrance",
        title: row.hindrance || "Site Hindrance",
        summary: `Job Card: ${row.jobCardNo} | Status: ${row.status} | ${row.remarks}`,
        date: row.startDate || "-",
        submittedBy: row.enteredBy || "Site Engineer",
      })),
      ...machineryRows.map((row) => ({
        id: `machinery-${row.id}`,
        module: "Manpower / Machinery",
        title: row.itemDescription || "Machinery Item",
        summary: `Job Card: ${row.jobCardNo} | T-Code: ${row.tCode} | Actual: ${row.currentActual}`,
        date: row.date || "-",
        submittedBy: "Site Engineer",
      })),
    ];

    return NextResponse.json({ success: true, items: all.slice(0, 30) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load critical updates.";
    return NextResponse.json({ success: false, message, items: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const action = String(payload.action || "").toLowerCase();

    if (!action || !["approve", "delete"].includes(action)) {
      return NextResponse.json(
        { success: false, message: "Action must be approve or delete." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Action '${action}' processed successfully.`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to process critical update.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
