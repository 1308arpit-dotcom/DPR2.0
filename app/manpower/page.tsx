"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Truck,
  PlusCircle,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Building,
  Tag,
  Wrench,
  Users,
} from "lucide-react";

type MachineryEntry = {
  id: string;
  timestamp: string;
  date: string;
  jobCardNo: string;
  tCode: string;
  itemDescription: string;
  currentActual: string;
  planQty: string;
  remarks: string;
};

type JobCardOption = {
  jobCardNo: string;
};

type MachineryOption = {
  tCode: string;
  itemDescription: string;
  jobCardNo: string;
};

export default function ManpowerPage() {
  const [jobCards, setJobCards] = useState<JobCardOption[]>([]);
  const [machineryOptions, setMachineryOptions] = useState<MachineryOption[]>([]);

  // Form states
  const [jobCardNo, setJobCardNo] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [tCode, setTCode] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [currentActual, setCurrentActual] = useState("");
  const [planQty, setPlanQty] = useState("");
  const [remark, setRemark] = useState("");

  const [entries, setEntries] = useState<MachineryEntry[]>([]);
  const [searchTable, setSearchTable] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setStatus("");
      const [masterRes, machRes] = await Promise.all([
        fetch("/api/master"),
        fetch("/api/manpower"),
      ]);

      const masterData = await masterRes.json();
      const machData = await machRes.json();

      if (masterData.success) {
        setJobCards(masterData.jobCards || []);
        setMachineryOptions(masterData.machinery || []);
      }

      if (machData.success) {
        setEntries(machData.items || []);
      }
    } catch (err) {
      console.error(err);
      setStatus("Failed to load machinery & manpower data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  function handleTCodeSelect(code: string) {
    setTCode(code);
    const item = machineryOptions.find((m) => m.tCode === code);
    if (item) {
      setItemDescription(item.itemDescription);
      if (!jobCardNo && item.jobCardNo) {
        setJobCardNo(item.jobCardNo);
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/manpower", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          jobCardNo,
          tCode,
          itemDescription,
          currentActual,
          planQty,
          remark,
        }),
      });

      const res = await response.json();
      if (!response.ok || !res.success) {
        throw new Error(res.message || "Failed to save entry");
      }

      setStatus("success:Recorded successfully to Google Sheet 'Machinery Input'!");
      setEntries((prev) => [
        {
          id: `mach-new-${Date.now()}`,
          timestamp: new Date().toISOString(),
          date,
          jobCardNo,
          tCode,
          itemDescription,
          currentActual,
          planQty,
          remarks: remark,
        },
        ...prev,
      ]);

      setCurrentActual("");
      setPlanQty("");
      setRemark("");
    } catch (err) {
      setStatus(`error:${err instanceof Error ? err.message : "Failed to record entry."}`);
    } finally {
      setSubmitting(false);
    }
  }

  const filteredEntries = entries.filter((entry) => {
    if (!searchTable) return true;
    const query = searchTable.toLowerCase();
    return (
      entry.jobCardNo.toLowerCase().includes(query) ||
      entry.tCode.toLowerCase().includes(query) ||
      entry.itemDescription.toLowerCase().includes(query) ||
      entry.remarks.toLowerCase().includes(query)
    );
  });

  return (
    <main className="min-h-screen bg-slate-50/60 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <header className="rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl shadow-slate-950/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
              <Truck className="h-3.5 w-3.5" />
              <span>Google Sheet Tab: 'Machinery Input'</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Plant, Machinery & Labor Tracking
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Monitor daily crane deployment, hydra operations, erection manpower, and resource shifts
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => void loadData()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-md hover:bg-white/20 transition active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Sync</span>
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

        {/* 2-Column Responsive Layout */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Form: 5 cols */}
          <div className="lg:col-span-5 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">Log Equipment / Labor</h2>
                <p className="text-xs text-slate-500">Appends to 'Machinery Input'</p>
              </div>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Wrench className="h-5 w-5" />
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  1. Resource / Equipment (from Machinery Sheet) *
                </label>
                <select
                  required
                  value={tCode}
                  onChange={(e) => handleTCodeSelect(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 font-mono text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition"
                >
                  <option value="">-- Select T-Code ({machineryOptions.length}) --</option>
                  {machineryOptions.map((m) => (
                    <option key={m.tCode} value={m.tCode}>
                      {m.tCode} - {m.itemDescription.substring(0, 36)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Equipment Description</label>
                <textarea
                  readOnly
                  rows={2}
                  value={itemDescription}
                  className="w-full rounded-xl border border-slate-200 bg-slate-100/80 p-2.5 text-xs text-slate-600 outline-none cursor-not-allowed"
                  placeholder="Auto-populated from Machinery sheet..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 p-2 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Job Card No *</label>
                  <select
                    required
                    value={jobCardNo}
                    onChange={(e) => setJobCardNo(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 p-2 text-xs font-mono text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition"
                  >
                    <option value="">-- Job Card --</option>
                    {jobCards.map((j) => (
                      <option key={j.jobCardNo} value={j.jobCardNo}>
                        {j.jobCardNo}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Current Actual *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 2"
                    value={currentActual}
                    onChange={(e) => setCurrentActual(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 p-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Plan Qty</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 2"
                    value={planQty}
                    onChange={(e) => setPlanQty(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 p-2 text-xs text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Shift & Operator Notes</label>
                <textarea
                  rows={2}
                  placeholder="Operator name, idle time reason, breakdown or shift hours..."
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              {status && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold flex items-start gap-2 ${
                    status.startsWith("success:")
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  {status.startsWith("success:") ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span>{status.replace(/^(success|error):/, "")}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 p-3 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:from-blue-500 hover:to-blue-600 transition active:scale-95 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Writing to Google Sheets...</span>
                  </>
                ) : (
                  <>
                    <Truck className="h-4 w-4" />
                    <span>Save Machinery Entry</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Table: 7 cols */}
          <div className="lg:col-span-7 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Recorded Plant & Labor Logs</h2>
                  <p className="text-xs text-slate-500">Live stream directly from sheet 'Machinery Input'</p>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search plant..."
                    value={searchTable}
                    onChange={(e) => setSearchTable(e.target.value)}
                    className="w-full sm:w-44 rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 outline-none transition"
                  />
                </div>
              </div>

              {loading ? (
                <div className="py-24 text-center">
                  <RefreshCw className="mx-auto h-6 w-6 text-blue-600 animate-spin" />
                  <p className="mt-3 text-xs font-semibold text-slate-700">Loading equipment stream from Google Sheets...</p>
                </div>
              ) : filteredEntries.length === 0 ? (
                <div className="py-24 text-center">
                  <Truck className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-3 text-xs font-bold text-slate-700">No machinery logs found</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Log machinery deployment using the left form.</p>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold tracking-wider text-slate-500">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Job Card</th>
                        <th className="py-2.5 px-3">T-Code</th>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3 text-right">Actual</th>
                        <th className="py-2.5 px-3 text-right">Plan</th>
                        <th className="py-2.5 px-3">Remark</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredEntries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-800">
                            {entry.date}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] font-bold text-indigo-700">
                            {entry.jobCardNo}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap font-mono font-bold text-slate-800">
                            {entry.tCode}
                          </td>
                          <td className="py-3 px-3 text-slate-700 max-w-[180px] truncate" title={entry.itemDescription}>
                            {entry.itemDescription}
                          </td>
                          <td className="py-3 px-3 text-right font-extrabold text-blue-700">
                            {entry.currentActual}
                          </td>
                          <td className="py-3 px-3 text-right text-slate-500">
                            {entry.planQty || "—"}
                          </td>
                          <td className="py-3 px-3 text-slate-500 max-w-[150px] truncate" title={entry.remarks}>
                            {entry.remarks || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Showing {filteredEntries.length} of {entries.length} items</span>
              <span>Fast 60s Cache Sync</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
