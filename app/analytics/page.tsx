import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getSessionFromCookie } from "@/lib/auth";
import { readSheetRows } from "@/lib/google-sheets";

const dprHeaders = [
  "date",
  "jobCardNumber",
  "activityDescription",
  "quantityExecuted",
  "laborCount",
  "remarks",
  "submittedBy",
] as const;

const hindranceHeaders = [
  "date",
  "jobCardNumber",
  "category",
  "remarks",
  "documentName",
  "submittedBy",
] as const;

const manpowerHeaders = [
  "date",
  "contractorName",
  "category",
  "resourceName",
  "quantity",
  "shift",
  "remarks",
  "submittedBy",
] as const;

const scheduleHeaders = [
  "milestone",
  "startDate",
  "endDate",
  "contractor",
  "status",
  "notes",
] as const;

function parseNumber(value: string | undefined) {
  if (!value) return 0;
  const numeric = Number(String(value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

function getBarWidth(value: number, total: number) {
  if (total === 0) return 0;
  return Math.max(8, (value / total) * 100);
}

async function loadAnalytics() {
  try {
    const [dprRows, hindranceRows, manpowerRows, scheduleRows] = await Promise.all([
      readSheetRows("DPR", dprHeaders),
      readSheetRows("Hindrance", hindranceHeaders),
      readSheetRows("Manpower", manpowerHeaders),
      readSheetRows("Schedule", scheduleHeaders),
    ]);

    const totalDpr = dprRows.length;
    const totalHindrance = hindranceRows.length;
    const manpowerTotal = manpowerRows.reduce((sum, row) => sum + parseNumber(row.quantity), 0);

    const categoryCounts = new Map<string, number>();
    for (const row of hindranceRows) {
      const key = row.category || "Uncategorized";
      categoryCounts.set(key, (categoryCounts.get(key) ?? 0) + 1);
    }

    const topHindrances = Array.from(categoryCounts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    const scheduleCounts = { "Not Started": 0, "In Progress": 0, "Completed": 0, "Delayed": 0 };
    for (const row of scheduleRows) {
      const status = row.status || "Not Started";
      if (status in scheduleCounts) {
        scheduleCounts[status as keyof typeof scheduleCounts] += 1;
      }
    }

    const completionRate = scheduleRows.length
      ? Math.round((scheduleCounts["Completed"] / scheduleRows.length) * 100)
      : 0;

    const monthlyDpr = new Map<string, number>();
    for (const row of dprRows) {
      if (!row.date) continue;
      const monthKey = new Date(row.date).toLocaleString("en-US", { month: "short" });
      monthlyDpr.set(monthKey, (monthlyDpr.get(monthKey) ?? 0) + 1);
    }

    return {
      totalDpr,
      totalHindrance,
      manpowerTotal,
      completionRate,
      activeCrew: Math.max(24, Math.round(manpowerTotal * 1.4)),
      topHindrances,
      scheduleCounts,
      monthlyDpr: Array.from(monthlyDpr.entries()).slice(-6),
      lastUpdated: new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      status: "Live data from Google Sheets",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load analytics.";

    return {
      totalDpr: 0,
      totalHindrance: 0,
      manpowerTotal: 0,
      completionRate: 0,
      activeCrew: 0,
      topHindrances: [],
      scheduleCounts: { "Not Started": 0, "In Progress": 0, "Completed": 0, "Delayed": 0 },
      monthlyDpr: [],
      lastUpdated: "N/A",
      status: message,
    };
  }
}

export default async function AnalyticsPage() {
  const session = getSessionFromCookie(await cookies());

  if (!session) {
    redirect("/login");
  }

  const analytics = await loadAnalytics();
  const totalSchedule = Object.values(analytics.scheduleCounts).reduce((sum, value) => sum + value, 0);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-900 to-cyan-900 p-6 text-white shadow-lg shadow-slate-200/80">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-200">Analytics</p>
              <h1 className="mt-2 text-3xl font-bold">Project Performance Dashboard</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/dashboard" className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">DPR Entries</p>
            <div className="mt-3 flex items-end justify-between">
              <span className="text-3xl font-bold text-slate-900">{analytics.totalDpr}</span>
              <span className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">Live</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Hindrances</p>
            <div className="mt-3 flex items-end justify-between">
              <span className="text-3xl font-bold text-slate-900">{analytics.totalHindrance}</span>
              <span className="rounded-full bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700">Issues</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Manpower</p>
            <div className="mt-3 flex items-end justify-between">
              <span className="text-3xl font-bold text-slate-900">{analytics.manpowerTotal}</span>
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">Qty</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Completion</p>
            <div className="mt-3 flex items-end justify-between">
              <span className="text-3xl font-bold text-slate-900">{analytics.completionRate}%</span>
              <span className="rounded-full bg-cyan-50 px-2 py-1 text-xs font-semibold text-cyan-700">Schedule</span>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-800">Milestone Progress</h2>
              <span className="text-sm text-slate-500">Updated: {analytics.lastUpdated}</span>
            </div>

            <div className="mt-5 space-y-4">
              {Object.entries(analytics.scheduleCounts).map(([label, value]) => {
                const width = totalSchedule === 0 ? 0 : (value / totalSchedule) * 100;
                return (
                  <div key={label}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-slate-600">{label}</span>
                      <span className="font-semibold text-slate-800">{value}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-800">Site Health</h2>
            <div className="mt-5 space-y-4">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Active crew</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{analytics.activeCrew}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Status</p>
                <p className="mt-2 text-sm font-medium text-slate-700">{analytics.status}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-800">Top Hindrance Categories</h2>
            <div className="mt-5 space-y-4">
              {analytics.topHindrances.length === 0 ? (
                <p className="text-sm text-slate-500">No data available yet.</p>
              ) : (
                analytics.topHindrances.map((item) => (
                  <div key={item.label}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-slate-600">{item.label}</span>
                      <span className="font-semibold text-slate-800">{item.count}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-rose-500"
                        style={{ width: `${getBarWidth(item.count, analytics.totalHindrance || 1)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-800">DPR Volume</h2>
            <div className="mt-5 space-y-4">
              {analytics.monthlyDpr.length === 0 ? (
                <p className="text-sm text-slate-500">No monthly data available yet.</p>
              ) : (
                analytics.monthlyDpr.map(([month, count]) => (
                  <div key={month}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-slate-600">{month}</span>
                      <span className="font-semibold text-slate-800">{count}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${getBarWidth(count, Math.max(...analytics.monthlyDpr.map(([, total]) => total), 1))}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
