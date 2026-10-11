import { NextRequest, NextResponse } from "next/server";
import {
  getJobCards,
  getBoqItems,
  getHindranceCategories,
  getMachineryOptions,
} from "@/lib/google-sheets";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const jobCard = searchParams.get("jobCard") || undefined;

    if (type === "job-cards") {
      const items = await getJobCards();
      return NextResponse.json({ success: true, items });
    }

    if (type === "boq") {
      const items = await getBoqItems(jobCard);
      return NextResponse.json({ success: true, items });
    }

    if (type === "hindrance-categories") {
      const items = await getHindranceCategories();
      return NextResponse.json({ success: true, items });
    }

    if (type === "machinery") {
      const items = await getMachineryOptions();
      return NextResponse.json({ success: true, items });
    }

    // Return all masters for fast initial page loading
    const [jobCards, boq, hindranceCategories, machinery] = await Promise.all([
      getJobCards(),
      getBoqItems(),
      getHindranceCategories(),
      getMachineryOptions(),
    ]);

    return NextResponse.json({
      success: true,
      jobCards,
      boq,
      hindranceCategories,
      machinery,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch master data.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
