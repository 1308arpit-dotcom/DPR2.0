"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertOctagon,
  PlusCircle,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Building,
  Tag,
  Clock,
  ShieldAlert,
} from "lucide-react";

type HindranceEntry = {
  id: string;
  timestamp: string;
  startDate: string;
  jobCardNo: string;
  hindrance: string;
  category: string;
  remarks: string;
  status: string;
  enteredBy: string;
};

type JobCardOption = {
  jobCardNo: string;
};

type HindranceCategory = {
  name: string;
  department: string;
  type: string;
};

export default function HindrancePage() {
  const [jobCards, setJobCards] = useState<JobCardOption[]>([]);
  const [categories, setCategories] = useState<HindranceCategory[]>([]);

  // Form states
  const [jobCardNo, setJobCardNo] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectHindrance, setSelectHindrance] = useState("");
  const [remark, setRemark] = useState("");
  const [uploadDocument, setUploadDocument] = useState("");

  const [entries, setEntries] = useState<HindranceEntry[]>([]);
  const [searchTable, setSearchTable] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setStatus("");
      const [masterRes, hinRes] = await Promise.all([
        fetch("/api/master"),
        fetch("/api/hinderance"),
      ]);

      const masterData = await masterRes.json();
      const hinData = await hinRes.json();

      if (masterData.success) {
        setJobCards(masterData.jobCards || []);
        setCategories(masterData.hindranceCategories || []);
      }

      if (hinData.success) {
        setEntries(hinData.items || []);
      }
    } catch (err) {
      console.error(err);
      setStatus("Failed to load initial hindrance data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/hinderance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobCardNo,
          startDate,
          selectHindrance,
          remark,
          uploadDocument,
        }),
      });

      const res = await response.json();
      if (!response.ok || !res.success) {
        throw new Error(res.message || "Failed to record hindrance");
      }

      setStatus("success:Hindrance successfully logged to Google Sheet 'Add Hindrance'!");
      setEntries((prev) => [
        {
          id: `HIN-${Math.floor(10000 + Math.random() * 90000)}`,
          timestamp: new Date().toISOString(),
          startDate,
          jobCardNo,
          hindrance: selectHindrance,
          category: selectHindrance.split("-")[0] || "",
          remarks: remark,
          status: "Open",
          enteredBy: "Site Engineer",
        },
        ...prev,
      ]);

      setRemark("");
      setUploadDocument("");
    } catch (err) {
      setStatus(`error:${err instanceof Error ? err.message : "Failed to record hindrance."}`);
    } finally {
      setSubmitting(false);
    }
  }

  const openCount = entries.filter((e) => e.status !== "Closed" && e.status !== "Resolved").length;
  const closedCount = entries.filter((e) => e.status === "Closed" || e.status === "Resolved").length;

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      !searchTable ||
      entry.jobCardNo.toLowerCase().includes(searchTable.toLowerCase()) ||
      entry.hindrance.toLowerCase().includes(searchTable.toLowerCase()) ||
      entry.remarks.toLowerCase().includes(searchTable.toLowerCase());

    const isClosed = entry.status === "Closed" || entry.status === "Resolved";
    const matchesFilter =
      statusFilter === "all" ||
      (statusFilter === "open" && !isClosed) ||
      (statusFilter === "closed" && isClosed);

    return matchesSearch && matchesFilter;
  });

  return (
    <main className="min-h-screen bg-slate-50/60 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <header className="rounded-3xl bg-gradient-to-r from-slate-950 via-rose-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl shadow-slate-950/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-400/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-300">
              <AlertOctagon className="h-3.5 w-3.5" />
              <span>Google Sheet Tab: 'Add Hindrance'</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Site Hindrance & Issue Reporting
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Report site stoppages, client clearances, material shortages, and vendor delays
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

        {/* Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Reported</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{entries.length}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Logged in spreadsheet</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600">Active / Open</p>
            <p className="text-2xl font-extrabold text-rose-700 mt-1">{openCount}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Requiring intervention</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs col-span-2 sm:col-span-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Resolved</p>
            <p className="text-2xl font-extrabold text-emerald-700 mt-1">{closedCount}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Cleared site issues</p>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Form: 5 cols */}
          <div className="lg:col-span-5 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">Report Site Hindrance</h2>
                <p className="text-xs text-slate-500">Appends to 'Add Hindrance' with Task ID</p>
              </div>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <ShieldAlert className="h-5 w-5" />
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Job Card No *</label>
                <select
                  required
                  value={jobCardNo}
                  onChange={(e) => setJobCardNo(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 font-mono text-xs text-slate-800 outline-none focus:border-rose-500 focus:bg-white transition"
                >
                  <option value="">-- Select Job Card ({jobCards.length}) --</option>
                  {jobCards.map((j) => (
                    <option key={j.jobCardNo} value={j.jobCardNo}>
                      {j.jobCardNo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Start Date Of Hindrance *</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 p-2 text-xs text-slate-800 outline-none focus:border-rose-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Hindrance Type (from Legend Sheet) *
                </label>
                <select
                  required
                  value={selectHindrance}
                  onChange={(e) => setSelectHindrance(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 text-xs text-slate-800 outline-none focus:border-rose-500 focus:bg-white transition"
                >
                  <option value="">-- Select Issue Category ({categories.length}) --</option>
                  {categories.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Root Cause & Detailed Remark *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain why the work is delayed or halted, affected grid lines, vendor details..."
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 text-xs text-slate-800 outline-none focus:border-rose-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Upload Evidence / Drive URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={uploadDocument}
                  onChange={(e) => setUploadDocument(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 p-2 text-xs text-slate-800 outline-none focus:border-rose-500 focus:bg-white transition font-mono"
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
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 p-3 text-xs font-bold text-white shadow-md shadow-rose-600/20 hover:from-rose-500 hover:to-rose-600 transition active:scale-95 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Logging issue to Google Sheet...</span>
                  </>
                ) : (
                  <>
                    <AlertOctagon className="h-4 w-4" />
                    <span>Submit Hindrance Entry</span>
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
                  <h2 className="text-base font-bold text-slate-900">Recorded Site Hindrances</h2>
                  <p className="text-xs text-slate-500">Live stream directly from sheet 'Add Hindrance'</p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Status tabs */}
                  <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200/60">
                    {["all", "open", "closed"].map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setStatusFilter(tab)}
                        className={`rounded-md px-2.5 py-1 text-[11px] font-semibold capitalize transition ${
                          statusFilter === tab
                            ? "bg-white text-slate-900 shadow-xs"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search issues..."
                      value={searchTable}
                      onChange={(e) => setSearchTable(e.target.value)}
                      className="w-36 rounded-xl border border-slate-200 bg-slate-50 pl-7 pr-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-rose-500 outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="py-24 text-center">
                  <RefreshCw className="mx-auto h-6 w-6 text-rose-600 animate-spin" />
                  <p className="mt-3 text-xs font-semibold text-slate-700">Loading hindrances from Google Sheets...</p>
                </div>
              ) : filteredEntries.length === 0 ? (
                <div className="py-24 text-center">
                  <AlertOctagon className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-3 text-xs font-bold text-slate-700">No hindrances found</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Great job! The site has zero recorded bottlenecks.</p>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold tracking-wider text-slate-500">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Job Card</th>
                        <th className="py-2.5 px-3">Hindrance Type</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Remark</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredEntries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-800">
                            {entry.startDate}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] font-bold text-indigo-700">
                            {entry.jobCardNo}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-900 max-w-[180px] truncate" title={entry.hindrance}>
                            {entry.hindrance}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                entry.status === "Closed" || entry.status === "Resolved"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {entry.status || "Open"}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600 max-w-[200px] truncate" title={entry.remarks}>
                            {entry.remarks}
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
              <span>Direct Sheets Sync</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
