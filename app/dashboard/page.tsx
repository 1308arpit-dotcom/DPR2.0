import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  FileSpreadsheet,
  AlertOctagon,
  Truck,
  CalendarDays,
  BarChart3,
  ShieldAlert,
  ArrowRight,
  HardHat,
  Clock,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

import { getSessionFromCookie, type SessionUser } from "@/lib/auth";
import {
  fetchDprEntries,
  fetchHindranceEntries,
  fetchMachineryEntries,
  fetchScheduleEntries,
} from "@/lib/google-sheets";

export default async function DashboardPage() {
  const session = getSessionFromCookie(await cookies());

  if (!session) {
    redirect("/login");
  }

  // Fetch live counts for the dashboard cards
  let dprCount = 0;
  let openHindranceCount = 0;
  let totalMachineryCount = 0;
  let totalScheduleCount = 0;

  try {
    const [dpr, hindrances, machinery, schedules] = await Promise.all([
      fetchDprEntries(50),
      fetchHindranceEntries(50),
      fetchMachineryEntries(50),
      fetchScheduleEntries(50),
    ]);

    dprCount = dpr.length;
    openHindranceCount = hindrances.filter((h) => h.status !== "Closed" && h.status !== "Resolved").length;
    totalMachineryCount = machinery.length;
    totalScheduleCount = schedules.length;
  } catch (err) {
    console.error("Dashboard count fetch error:", err);
  }

  const userModules = [
    {
      title: "DPR Logging",
      sheet: "Tab: 'Input '",
      description: "Log daily activities, BOQ line item completion, and labor counts",
      href: "/dpr",
      icon: FileSpreadsheet,
      accent: "from-indigo-500 to-indigo-600",
      accentBg: "bg-indigo-50 text-indigo-700 border-indigo-200",
      metric: `${dprCount} recent entries`,
      actionText: "New DPR Entry",
    },
    {
      title: "Hindrance Reporting",
      sheet: "Tab: 'Add Hindrance'",
      description: "Submit site bottlenecks, material shortages, and client delays",
      href: "/hinderance",
      icon: AlertOctagon,
      accent: "from-rose-500 to-rose-600",
      accentBg: "bg-rose-50 text-rose-700 border-rose-200",
      metric: `${openHindranceCount} open issues`,
      actionText: "Report Issue",
    },
    {
      title: "Plant & Machinery Tracking",
      sheet: "Tab: 'Machinery Input'",
      description: "Record hydra, cranes, and specialized labor deployment",
      href: "/manpower",
      icon: Truck,
      accent: "from-blue-500 to-blue-600",
      accentBg: "bg-blue-50 text-blue-700 border-blue-200",
      metric: `${totalMachineryCount} plant logs`,
      actionText: "Log Equipment",
    },
    {
      title: "Schedule & Milestones",
      sheet: "Tab: 'Schedules'",
      description: "Track project milestones, planned vs actual progress percentages",
      href: "/schedule",
      icon: CalendarDays,
      accent: "from-emerald-500 to-emerald-600",
      accentBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      metric: `${totalScheduleCount} milestones`,
      actionText: "View Milestones",
    },
  ];

  const adminOnlyModules = [
    {
      title: "Analytics & KPI Center",
      sheet: "Aggregated Sheets",
      description: "Deep dive into production curves, labor burn rates, and hindrance metrics",
      href: "/analytics",
      icon: BarChart3,
      accent: "from-violet-500 to-violet-600",
      accentBg: "bg-violet-50 text-violet-700 border-violet-200",
      metric: "Live sync active",
      actionText: "Launch Analytics",
    },
    {
      title: "Critical Updates & Audit",
      sheet: "All Modules",
      description: "Review pending site logs, approve daily inputs, and audit entries",
      href: "/critical-updates",
      icon: ShieldAlert,
      accent: "from-amber-500 to-amber-600",
      accentBg: "bg-amber-50 text-amber-700 border-amber-200",
      metric: "Triage queue",
      actionText: "Review Queue",
    },
  ];

  const modules = session.role === "admin" ? [...userModules, ...adminOnlyModules] : userModules;

  return (
    <main className="min-h-screen bg-slate-50/60 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Hero Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 p-6 sm:p-10 text-white shadow-xl shadow-slate-900/10">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-200 backdrop-blur-md">
                <HardHat className="h-3.5 w-3.5 text-amber-400" />
                <span>EPACK Construction Management Portal</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                Welcome back, {session.name}
              </h1>
              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                Connected to Google Spreadsheet <strong className="text-white">Copy of DPR Tool v2</strong>.
                Record daily site progress, manage hindrances, and track plant resources.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/dpr"
                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 transition-all hover:bg-indigo-500 hover:shadow-indigo-600/50 active:scale-95"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>New DPR Entry</span>
              </Link>

              <Link
                href="/hinderance"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-95"
              >
                <AlertOctagon className="h-4 w-4 text-rose-300" />
                <span>Report Issue</span>
              </Link>
            </div>
          </div>

          {/* Quick Metrics Ribbon inside Hero */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-white/10">
            <div className="rounded-2xl bg-white/5 p-3.5 border border-white/5 backdrop-blur-xs">
              <p className="text-[11px] uppercase tracking-wider text-indigo-200 font-semibold">DPR Logs</p>
              <p className="text-xl sm:text-2xl font-bold mt-1">{dprCount}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Stream: 'Input '</p>
            </div>

            <div className="rounded-2xl bg-white/5 p-3.5 border border-white/5 backdrop-blur-xs">
              <p className="text-[11px] uppercase tracking-wider text-rose-200 font-semibold">Open Hindrances</p>
              <p className="text-xl sm:text-2xl font-bold mt-1 text-rose-300">{openHindranceCount}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Stream: 'Add Hindrance'</p>
            </div>

            <div className="rounded-2xl bg-white/5 p-3.5 border border-white/5 backdrop-blur-xs">
              <p className="text-[11px] uppercase tracking-wider text-blue-200 font-semibold">Active Plant</p>
              <p className="text-xl sm:text-2xl font-bold mt-1 text-blue-300">{totalMachineryCount}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Stream: 'Machinery Input'</p>
            </div>

            <div className="rounded-2xl bg-white/5 p-3.5 border border-white/5 backdrop-blur-xs">
              <p className="text-[11px] uppercase tracking-wider text-emerald-200 font-semibold">Milestones</p>
              <p className="text-xl sm:text-2xl font-bold mt-1 text-emerald-300">{totalScheduleCount}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Stream: 'Schedules'</p>
            </div>
          </div>
        </section>

        {/* Modules Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Active Work Modules</h2>
              <p className="text-xs text-slate-500">Select an operational module to read or record sheet data</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-200/80 text-slate-700">
              Role: {session.role === "admin" ? "Admin (All Access)" : "User (Field Ops)"}
            </span>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((m) => {
              const Icon = m.icon;

              return (
                <Link
                  key={m.title}
                  href={m.href}
                  className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr ${m.accent} text-white shadow-md shadow-indigo-500/15 group-hover:scale-105 transition-transform`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-500">
                        {m.sheet}
                      </span>
                    </div>

                    <h3 className="mt-4 text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {m.title}
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                      {m.description}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100">
                    <span className="text-xs font-semibold text-slate-700">
                      {m.metric}
                    </span>

                    <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                      <span>{m.actionText}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Security & Access Overview */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Enterprise Access & Sheets Mapping</h3>
              <p className="text-xs text-slate-500">Google Sheets API v4 integration security context</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>JWT Service Account Auth Active</span>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
              <div className="flex items-center gap-2">
                <HardHat className="h-4 w-4 text-indigo-600" />
                <h4 className="text-sm font-bold text-slate-900">Site Engineer Capabilities</h4>
              </div>
              <ul className="mt-3 space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Read BOQ items and Job Cards to submit verified DPR logs</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Report high-priority site hindrances with categorized tags</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Record daily heavy machinery & labor headcounts</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-indigo-700" />
                <h4 className="text-sm font-bold text-indigo-950">Project Manager / Admin Privileges</h4>
              </div>
              <ul className="mt-3 space-y-2 text-xs text-indigo-900">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                  <span>Real-time executive analytics & aggregated productivity metrics</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                  <span>Milestone & schedule variance tracking across buildings</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                  <span>Audit and critical update triage queue oversight</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
