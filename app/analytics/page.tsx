import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  BarChart3,
  TrendingUp,
  Users,
  AlertOctagon,
  CalendarDays,
  ArrowLeft,
  FileSpreadsheet,
  CheckCircle2,
  HardHat,
  Truck,
  Activity,
  Layers,
} from "lucide-react";

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
      fetchDprEntries(100),
      fetchHindranceEntries(100),
      fetchMachineryEntries(100),
      fetchScheduleEntries(100),
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
    <main className="min-h-screen bg-slate-50/60 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <header className="rounded-3xl bg-gradient-to-r from-slate-950 via-violet-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl shadow-slate-950/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300">
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Multi-Sheet Live Aggregation</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Executive Analytics & Progress Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Aggregated intelligence from Input, Add Hindrance, Machinery Input & Schedules
            </p>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-900 shadow-sm hover:bg-slate-100 transition active:scale-95 self-start md:self-auto"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Dashboard</span>
          </Link>
        </header>

        {/* 4 Primary KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm hover:border-indigo-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                Executed Qty
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-extrabold text-slate-900">
              {data.stats.totalQuantity.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-slate-500">Cumulative units across BOQ items</p>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm hover:border-emerald-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                Total Manpower
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-extrabold text-slate-900">
              {data.stats.totalLabor.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-slate-500">Total deployed labor person-days</p>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm hover:border-rose-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
                Open Bottlenecks
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <AlertOctagon className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-extrabold text-rose-700">
              {data.stats.openHindrances}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Out of {data.stats.totalHindrances} total reported issues
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm hover:border-violet-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-violet-600">
                Active Milestones
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <CalendarDays className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-extrabold text-slate-900">
              {data.stats.totalSchedules}
            </p>
            <p className="mt-1 text-xs text-slate-500">Building phases & schedules</p>
          </div>
        </div>

        {/* Operational Feeds Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent DPR Logs */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <FileSpreadsheet className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Recent DPR Logs</h2>
                    <p className="text-xs text-slate-500">Source: Sheet 'Input '</p>
                  </div>
                </div>
                <Link href="/dpr" className="text-xs font-bold text-indigo-600 hover:underline">
                  View All →
                </Link>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {data.dprRows.length === 0 ? (
                  <p className="text-xs text-slate-500 py-8 text-center">No DPR entries found in sheet.</p>
                ) : (
                  data.dprRows.slice(0, 8).map((r) => (
                    <div
                      key={r.id}
                      className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 hover:border-indigo-200 transition"
                    >
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                        <span className="font-mono text-indigo-700">{r.lineCode}</span>
                        <span>{r.date || r.timestamp}</span>
                      </div>
                      <p className="mt-1 text-xs font-bold text-slate-800 line-clamp-1">{r.itemDescription}</p>
                      <div className="mt-2.5 flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-200/60">
                        <span>Actual: <strong className="text-slate-900">{r.actualQty}</strong></span>
                        <span>Labor: <strong>{r.manpower}</strong></span>
                        <span className="text-[11px] text-slate-400">By: {r.enteredBy}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Active Hindrances */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                    <AlertOctagon className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Active Site Bottlenecks</h2>
                    <p className="text-xs text-slate-500">Source: Sheet 'Add Hindrance'</p>
                  </div>
                </div>
                <Link href="/hinderance" className="text-xs font-bold text-rose-600 hover:underline">
                  View All →
                </Link>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {data.hindranceRows.length === 0 ? (
                  <p className="text-xs text-slate-500 py-8 text-center">No hindrances logged in sheet.</p>
                ) : (
                  data.hindranceRows.slice(0, 8).map((h) => (
                    <div
                      key={h.id}
                      className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 hover:border-rose-200 transition"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-indigo-700 font-bold">{h.jobCardNo}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            h.status === "Closed"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {h.status || "Open"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-bold text-slate-900">{h.hindrance}</p>
                      <p className="mt-1 text-xs text-slate-500 line-clamp-2">{h.remarks}</p>
                      <div className="mt-2 text-[10px] text-slate-400 flex justify-between pt-2 border-t border-slate-200/60">
                        <span>Date: {h.startDate}</span>
                        <span>ID: {h.id}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
