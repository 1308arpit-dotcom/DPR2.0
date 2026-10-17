"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Search,
  Filter,
  ArrowLeft,
  CheckCircle2,
  Clock,
  TrendingUp,
  Building,
  RefreshCw,
} from "lucide-react";

export type ScheduleItem = {
  id: string;
  jobCardNo: string;
  description: string;
  status: string;
  totalQty: string;
  actualQty: string;
  percentActual: string;
  planStartDate: string;
  actualStartDate: string;
  planEndDate: string;
  actualEndDate: string;
  remark: string;
};

export default function ScheduleModule() {
  const [entries, setEntries] = useState<ScheduleItem[]>([]);
  const [filterJobCard, setFilterJobCard] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const loadSchedule = async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await fetch("/api/schedule");
      if (!response.ok) {
        throw new Error("Failed to load schedules from sheet.");
      }

      const data = (await response.json()) as { items?: ScheduleItem[] };
      if (Array.isArray(data.items)) {
        setEntries(data.items);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load schedule data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSchedule();
  }, []);

  const uniqueJobCards = Array.from(new Set(entries.map((e) => e.jobCardNo).filter(Boolean)));

  const filteredEntries = entries.filter((e) => {
    const matchesJobCard = !filterJobCard || e.jobCardNo.toLowerCase() === filterJobCard.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.jobCardNo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "completed" && Number(e.percentActual || 0) >= 100) ||
      (statusFilter === "in-progress" && Number(e.percentActual || 0) > 0 && Number(e.percentActual || 0) < 100) ||
      (statusFilter === "pending" && Number(e.percentActual || 0) === 0);

    return matchesJobCard && matchesSearch && matchesStatus;
  });

  // Calculate summary metrics
  const completedCount = entries.filter((e) => Number(e.percentActual || 0) >= 100).length;
  const inProgressCount = entries.filter((e) => {
    const p = Number(e.percentActual || 0);
    return p > 0 && p < 100;
  }).length;
  const avgCompletion =
    entries.length > 0
      ? Math.round(entries.reduce((acc, curr) => acc + (Number(curr.percentActual) || 0), 0) / entries.length)
      : 0;

  return (
    <main className="min-h-screen bg-slate-50/60 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <header className="rounded-3xl bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl shadow-slate-950/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Google Sheet Tab: 'Schedules'</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Schedule & Milestone Tracking
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Live tracking of building milestones, erection schedules, and planned vs actual progress
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => void loadSchedule()}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-md hover:bg-white/20 transition active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-900 shadow-sm hover:bg-slate-100 transition active:scale-95"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Dashboard</span>
            </Link>
          </div>
        </header>

        {/* Quick KPI stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Milestones</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{entries.length}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Across all job cards</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Completed</p>
            <p className="mt-1 text-2xl font-extrabold text-emerald-700">{completedCount}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">100% finished milestones</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600">In Progress</p>
            <p className="mt-1 text-2xl font-extrabold text-blue-700">{inProgressCount}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Actively advancing</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Avg Progress</p>
            <p className="mt-1 text-2xl font-extrabold text-indigo-700">{avgCompletion}%</p>
            <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${avgCompletion}%` }} />
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search milestone or building..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-500 outline-none transition"
              />
            </div>

            {/* Job Card Filter */}
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-slate-400" />
              <select
                value={filterJobCard}
                onChange={(e) => setFilterJobCard(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-medium text-slate-800 outline-none focus:border-indigo-500"
              >
                <option value="">All Job Cards ({uniqueJobCards.length})</option>
                {uniqueJobCards.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status Segmented Tabs */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200/60 self-start md:self-auto">
            {[
              { id: "all", label: "All" },
              { id: "in-progress", label: "Active" },
              { id: "completed", label: "Done" },
              { id: "pending", label: "Pending" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  statusFilter === tab.id
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700">
            {error}
          </div>
        )}

        {/* Schedule List */}
        <div className="space-y-3.5">
          {isLoading ? (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center">
              <RefreshCw className="mx-auto h-6 w-6 text-indigo-600 animate-spin" />
              <p className="mt-3 text-sm font-semibold text-slate-800">Reading live schedule from Google Sheets...</p>
              <p className="text-xs text-slate-400 mt-1">Caching response to guarantee ultra-fast delivery</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center">
              <CalendarDays className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-bold text-slate-800">No matching milestone rows found</p>
              <p className="text-xs text-slate-500 mt-1">Try clearing your search query or job card filter.</p>
            </div>
          ) : (
            filteredEntries.map((entry) => {
              const percent = Math.min(100, Math.max(0, Number(entry.percentActual) || 0));

              return (
                <div
                  key={entry.id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-lg">
                          {entry.jobCardNo || "General Project"}
                        </span>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900">
                          {entry.description}
                        </h3>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            percent >= 100
                              ? "bg-emerald-100 text-emerald-800"
                              : percent > 0
                              ? "bg-blue-100 text-blue-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {entry.status || (percent >= 100 ? "Completed" : "Running")}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 pt-1">
                        <span>
                          Plan: <strong className="text-slate-700">{entry.planStartDate || "—"}</strong> to{" "}
                          <strong className="text-slate-700">{entry.planEndDate || "—"}</strong>
                        </span>
                        {entry.actualStartDate && (
                          <span className="text-emerald-700">
                            Actual Start: <strong>{entry.actualStartDate}</strong>
                          </span>
                        )}
                        {entry.remark && (
                          <span className="text-slate-400 italic">
                            "{entry.remark}"
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar & Stats */}
                    <div className="flex items-center gap-6 lg:min-w-[320px]">
                      <div className="flex-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                          <span>Progress</span>
                          <span className={percent >= 100 ? "text-emerald-600" : "text-indigo-600"}>
                            {percent}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              percent >= 100
                                ? "bg-emerald-500"
                                : percent >= 50
                                ? "bg-indigo-600"
                                : "bg-amber-500"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-right shrink-0">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Total Qty</p>
                          <p className="text-xs font-bold text-slate-800">{entry.totalQty || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Actual Qty</p>
                          <p className="text-xs font-bold text-emerald-700">{entry.actualQty || "0"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
