import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getSessionFromCookie } from "@/lib/auth";
import {
  fetchDprEntries,
  fetchHindranceEntries,
  fetchMachineryEntries,
  fetchScheduleEntries,
} from "@/lib/google-sheets";

function parseNumber(value: string | undefined) {
  if (!value) return 0;
  const numeric = Number(String(value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

async function loadAnalytics() {
  try {
    const [dprRows, hindranceRows, machineryRows, scheduleRows] = await Promise.all([
      fetchDprEntries(),
      fetchHindranceEntries(),
      fetchMachineryEntries(),
      fetchScheduleEntries(),
    ]);

    const totalQuantity = dprRows.reduce((sum, item) => sum + parseNumber(item.actualQty), 0);
    const totalLabor = dprRows.reduce((sum, item) => sum + parseNumber(item.manpower), 0);
    const totalHindrances = hindranceRows.length;
    const openHindrances = hindranceRows.filter((h) => h.status !== "Closed" && h.status !== "Resolved").length;
    const totalMachinery = machineryRows.length;
    const totalSchedules = scheduleRows.length;

    return {
      dprRows,
      hindranceRows,
      machineryRows,
      scheduleRows,
      stats: {
        totalQuantity,
        totalLabor,
        totalHindrances,
        openHindrances,
        totalMachinery,
        totalSchedules,
      },
    };
  } catch (error) {
    console.error("Error loading analytics:", error);
    return {
      dprRows: [],
      hindranceRows: [],
      machineryRows: [],
      scheduleRows: [],
      stats: {
        totalQuantity: 0,
        totalLabor: 0,
        totalHindrances: 0,
        openHindrances: 0,
        totalMachinery: 0,
        totalSchedules: 0,
      },
    };
  }
}

export default async function AnalyticsPage() {
  const session = getSessionFromCookie(await cookies());

  if (!session) {
    redirect("/login");
  }

  const data = await loadAnalytics();

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 p-6 text-white shadow-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-indigo-300">Live Sheets Sync</p>
              <h1 className="mt-2 text-3xl font-bold">Analytics & Progress Dashboard</h1>
              <p className="mt-1 text-sm text-slate-300">
                Aggregated from pre-existing sheets: Input, Add Hindrance, Machinery Input & Schedules
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </header>

        {/* Metric Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">DPR Executed</span>
            <p className="mt-4 text-3xl font-bold text-slate-900">{data.stats.totalQuantity.toLocaleString()}</p>
            <p className="mt-1 text-xs text-slate-500">Total units across all activities</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Total Manpower</span>
            <p className="mt-4 text-3xl font-bold text-slate-900">{data.stats.totalLabor.toLocaleString()}</p>
            <p className="mt-1 text-xs text-slate-500">Total deployed labor recorded</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">Open Hindrances</span>
            <p className="mt-4 text-3xl font-bold text-slate-900">{data.stats.openHindrances}</p>
            <p className="mt-1 text-xs text-slate-500">Out of {data.stats.totalHindrances} reported issues</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">Active Schedules</span>
            <p className="mt-4 text-3xl font-bold text-slate-900">{data.stats.totalSchedules}</p>
            <p className="mt-1 text-xs text-slate-500">Milestone rows monitored</p>
          </div>
        </div>

        {/* Data Previews */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent DPR Logs */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800">Recent DPR Logs (Sheet: 'Input ')</h2>
            <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
              {data.dprRows.length === 0 ? (
                <p className="text-sm text-slate-500">No DPR entries found in sheet.</p>
              ) : (
                data.dprRows.slice(0, 10).map((r) => (
                  <div key={r.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{r.date || r.timestamp}</span>
                      <span className="font-semibold text-slate-700">{r.lineCode}</span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-slate-800 line-clamp-1">{r.itemDescription}</p>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                      <span>Qty: <strong>{r.actualQty}</strong></span>
                      <span>Manpower: <strong>{r.manpower}</strong></span>
                      <span className="text-slate-400">By: {r.enteredBy}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Hindrances */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800">Active Hindrances (Sheet: 'Add Hindrance')</h2>
            <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
              {data.hindranceRows.length === 0 ? (
                <p className="text-sm text-slate-500">No hindrances logged in sheet.</p>
              ) : (
                data.hindranceRows.slice(0, 10).map((h) => (
                  <div key={h.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-500">{h.startDate}</span>
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                        {h.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{h.hindrance}</p>
                    <p className="mt-1 text-xs text-slate-600 line-clamp-2">{h.remarks}</p>
                    <div className="mt-2 text-[11px] text-slate-500 flex justify-between">
                      <span>Job Card: <strong>{h.jobCardNo}</strong></span>
                      <span>ID: {h.id}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
