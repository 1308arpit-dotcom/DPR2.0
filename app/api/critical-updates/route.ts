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

const HINDERANCE_HEADERS = [
  "date",
  "jobCardNumber",
  "category",
  "remarks",
  "documentName",
  "submittedBy",
] as const;

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

const ACTION_HEADERS = [
  "timestamp",
  "module",
  "title",
  "summary",
  "action",
  "performedBy",
] as const;

function createSummaryFor(item: Record<string, string>, module: string) {
  if (module === "DPR") {
    return `${item.activityDescription || "DPR activity"} | Job Card ${item.jobCardNumber || "-"}`;
  }

  if (module === "Hindrance") {
    return `${item.category || "Issue"} | ${item.remarks || "No remarks"}`;
  }

  return `${item.resourceName || "Resource"} | ${item.category || "Category"} | Qty ${item.quantity || "0"}`;
}

export async function GET() {
  try {
    const [dprRows, hindranceRows, manpowerRows] = await Promise.all([
      readSheetRows("DPR", DPR_HEADERS),
      readSheetRows("Hindrance", HINDERANCE_HEADERS),
      readSheetRows("Manpower", MANPOWER_HEADERS),
    ]);

    const all = [
      ...dprRows.map((row) => ({
        id: `dpr-${row.date || ""}-${row.jobCardNumber || ""}`,
        module: "DPR",
        title: row.activityDescription || "DPR Activity",
        summary: createSummaryFor(row, "DPR"),
        date: row.date || "-",
        submittedBy: row.submittedBy || "Unknown",
      })),
      ...hindranceRows.map((row) => ({
        id: `hindrance-${row.date || ""}-${row.jobCardNumber || ""}`,
        module: "Hindrance",
        title: row.category || "Hindrance",
        summary: createSummaryFor(row, "Hindrance"),
        date: row.date || "-",
        submittedBy: row.submittedBy || "Unknown",
      })),
      ...manpowerRows.map((row) => ({
        id: `manpower-${row.date || ""}-${row.contractorName || ""}`,
        module: "Manpower",
        title: row.resourceName || "Manpower Entry",
        summary: createSummaryFor(row, "Manpower"),
        date: row.date || "-",
        submittedBy: row.submittedBy || "Unknown",
      })),
    ];

    return NextResponse.json({ success: true, items: all.slice(0, 25) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load critical updates.";
    return NextResponse.json({ success: false, message, items: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const action = String(payload.action || "").toLowerCase();
    const module = String(payload.module || "General");
    const title = String(payload.title || "Critical Update");
    const summary = String(payload.summary || "No summary");
    const performedBy = String(payload.performedBy || "Admin");

    if (!action || !["approve", "delete"].includes(action)) {
      return NextResponse.json({ success: false, message: "Action must be approve or delete." }, { status: 400 });
    }

    const timestamp = new Date().toISOString();
    await appendSheetRow("CriticalActions", ACTION_HEADERS, {
      timestamp,
      module,
      title,
      summary,
      action,
      performedBy,
    });

    return NextResponse.json({ success: true, message: `Critical update ${action}d successfully.` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to process critical update.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
