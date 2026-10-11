"use client";

import { useEffect, useState } from "react";

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        setIsLoading(true);
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

    void loadSchedule();
  }, []);

  const uniqueJobCards = Array.from(new Set(entries.map((e) => e.jobCardNo).filter(Boolean)));

  const filteredEntries = filterJobCard
    ? entries.filter((e) => e.jobCardNo.toLowerCase() === filterJobCard.toLowerCase())
    : entries;

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl bg-gradient-to-r from-indigo-700 via-violet-700 to-sky-600 p-6 text-white shadow-lg">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-indigo-100">
                Live Google Sheets • Tab: 'Schedules'
              </p>
              <h1 className="mt-2 text-3xl font-bold">Schedule & Milestone Tracking</h1>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-indigo-100">Total Items</p>
              <p className="mt-1 text-2xl font-semibold">{entries.length}</p>
            </div>
          </div>
        </header>

        {/* Filter Bar */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-slate-700">Filter by Job Card:</label>
            <select
              value={filterJobCard}
              onChange={(e) => setFilterJobCard(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono"
            >
              <option value="">-- All Job Cards ({uniqueJobCards.length}) --</option>
              {uniqueJobCards.map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </select>
          </div>
          {isLoading && <span className="text-xs text-indigo-600 font-medium animate-pulse">Syncing sheet...</span>}
        </div>

        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-xs font-medium text-rose-700">
            {error}
          </div>
        )}

        {/* Schedule List */}
        <div className="space-y-4">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-200 transition"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {entry.jobCardNo || "General"}
                    </span>
                    <h3 className="text-base font-semibold text-slate-900">{entry.description}</h3>
                    <span className="rounded-full bg-slate-100 text-slate-700 px-2.5 py-0.5 text-xs font-medium">
                      {entry.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Plan: <strong>{entry.planStartDate || "—"}</strong> to <strong>{entry.planEndDate || "—"}</strong>
                    {entry.actualStartDate && (
                      <span className="ml-3 text-slate-700">
                        Actual: <strong>{entry.actualStartDate}</strong> to <strong>{entry.actualEndDate || "Ongoing"}</strong>
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-6 text-right">
                  <div>
                    <p className="text-[10px] uppercase font-semibold text-slate-400">Total Qty</p>
                    <p className="text-sm font-bold text-slate-800">{entry.totalQty || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-semibold text-slate-400">Actual Qty</p>
                    <p className="text-sm font-bold text-emerald-600">{entry.actualQty || "0"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-semibold text-slate-400">% Done</p>
                    <p className="text-sm font-bold text-indigo-600">{entry.percentActual || "0"}%</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
