"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ShieldAlert,
  Check,
  Trash2,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Filter,
  FileSpreadsheet,
  AlertOctagon,
  Truck,
} from "lucide-react";

type CriticalItem = {
  id: string;
  module: string;
  title: string;
  summary: string;
  date: string;
  submittedBy: string;
};

export default function CriticalUpdatesPage() {
  const [items, setItems] = useState<CriticalItem[]>([]);
  const [moduleFilter, setModuleFilter] = useState("all");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadItems() {
    try {
      setLoading(true);
      setStatus("");
      const response = await fetch("/api/critical-updates");
      const data = (await response.json()) as { success?: boolean; items?: CriticalItem[]; message?: string };

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load critical updates.");
      }

      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to load critical updates.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadItems();
  }, []);

  async function updateAction(action: "approve" | "delete", item: CriticalItem) {
    setStatus("");

    try {
      const response = await fetch("/api/critical-updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          module: item.module,
          title: item.title,
          summary: item.summary,
          performedBy: "Admin",
        }),
      });

      const data = (await response.json()) as { success?: boolean; message?: string };
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to process request.");
      }

      setItems((current) => current.filter((entry) => entry.id !== item.id));
      setStatus(`success:${data.message || `Item ${action === "approve" ? "approved" : "archived"} successfully.`}`);
    } catch (error) {
      setStatus(`error:${error instanceof Error ? error.message : "Failed to process critical update."}`);
    }
  }

  const filteredItems = items.filter((item) => {
    if (moduleFilter === "all") return true;
    return item.module.toLowerCase().includes(moduleFilter.toLowerCase());
  });

  return (
    <main className="min-h-screen bg-slate-50/60 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <header className="rounded-3xl bg-gradient-to-r from-slate-950 via-amber-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl shadow-slate-950/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Admin Queue & Audit Triage</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Critical Updates & Review Queue
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Review and audit pending site inputs across DPR, Hindrance, and Machinery modules
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => void loadItems()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-md hover:bg-white/20 transition active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
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

        {status && (
          <div
            className={`rounded-2xl p-4 text-xs font-semibold flex items-center gap-2 ${
              status.startsWith("success:")
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            {status.startsWith("success:") ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{status.replace(/^(success|error):/, "")}</span>
          </div>
        )}

        {/* Triage Section */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Pending Review Items</h2>
              <p className="text-xs text-slate-500">Live feed of unverified or recently reported site activities</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Filter:</span>
              <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200/60">
                {[
                  { id: "all", label: "All" },
                  { id: "dpr", label: "DPR" },
                  { id: "hindrance", label: "Hindrance" },
                  { id: "machinery", label: "Plant" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setModuleFilter(tab.id)}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                      moduleFilter === tab.id
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-24 text-center">
              <RefreshCw className="mx-auto h-6 w-6 text-amber-600 animate-spin" />
              <p className="mt-3 text-xs font-semibold text-slate-700">Aggregating review queue from Google Sheets...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-24 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
              <p className="mt-3 text-sm font-bold text-slate-800">All caught up! Queue is clear.</p>
              <p className="text-xs text-slate-400 mt-1">No pending critical updates requiring admin review.</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredItems.map((item) => {
                const isDpr = item.module === "DPR";
                const isHindrance = item.module === "Hindrance";

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5 hover:bg-white hover:border-amber-300 hover:shadow-xs transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              isDpr
                                ? "bg-indigo-100 text-indigo-700"
                                : isHindrance
                                ? "bg-rose-100 text-rose-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {item.module}
                          </span>
                          <span className="text-xs text-slate-400">{item.date}</span>
                        </div>

                        <h3 className="text-sm sm:text-base font-bold text-slate-900">
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-600 font-medium">
                          {item.summary}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Logged by: <strong className="text-slate-600">{item.submittedBy}</strong>
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => void updateAction("approve", item)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition active:scale-95"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Approve</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => void updateAction("delete", item)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition active:scale-95"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Archive</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
