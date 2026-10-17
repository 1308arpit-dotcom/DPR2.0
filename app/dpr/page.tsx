"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  FileSpreadsheet,
  PlusCircle,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Layers,
  ArrowLeft,
  Users,
  Hash,
  FileText,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

type DprEntry = {
  id: string;
  timestamp: string;
  date: string;
  lineCode: string;
  itemDescription: string;
  actualQty: string;
  manpower: string;
  remarks: string;
  enteredBy: string;
  uploadDocument?: string;
};

type JobCardOption = {
  jobCardNo: string;
};

type BoqOption = {
  lineCode: string;
  itemDescription: string;
  jobCard: string;
  balanceQty: string;
  totalQty: string;
};

export default function DprPage() {
  const [jobCards, setJobCards] = useState<JobCardOption[]>([]);
  const [selectedJobCard, setSelectedJobCard] = useState("");
  const [boqList, setBoqList] = useState<BoqOption[]>([]);
  const [filteredBoq, setFilteredBoq] = useState<BoqOption[]>([]);

  // Form states
  const [lineCode, setLineCode] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [dateOfDpr, setDateOfDpr] = useState(new Date().toISOString().split("T")[0]);
  const [actualQty, setActualQty] = useState("");
  const [manpower, setManpower] = useState("");
  const [remark, setRemark] = useState("");
  const [uploadDocument, setUploadDocument] = useState("");

  const [entries, setEntries] = useState<DprEntry[]>([]);
  const [searchTable, setSearchTable] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setStatus("");
      const [masterRes, dprRes] = await Promise.all([
        fetch("/api/master"),
        fetch("/api/dpr"),
      ]);

      const masterData = await masterRes.json();
      const dprData = await dprRes.json();

      if (masterData.success) {
        setJobCards(masterData.jobCards || []);
        setBoqList(masterData.boq || []);
      }

      if (dprData.success) {
        setEntries(dprData.items || []);
      }
    } catch (err) {
      console.error(err);
      setStatus(err instanceof Error ? err.message : "Failed to load sheet data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  // Filter BOQ items when job card changes
  useEffect(() => {
    if (selectedJobCard) {
      const filtered = boqList.filter(
        (b) => b.jobCard.toLowerCase() === selectedJobCard.toLowerCase()
      );
      setFilteredBoq(filtered);
    } else {
      setFilteredBoq(boqList.slice(0, 100));
    }
  }, [selectedJobCard, boqList]);

  // When Line Code is chosen, autofill description
  function handleLineCodeSelect(code: string) {
    setLineCode(code);
    const item = boqList.find((b) => b.lineCode === code);
    if (item) {
      setItemDescription(item.itemDescription);
      if (!selectedJobCard && item.jobCard) {
        setSelectedJobCard(item.jobCard);
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/dpr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lineCode,
          itemDescription,
          actualQty,
          manpower,
          dateOfDpr,
          remark,
          uploadDocument,
        }),
      });

      const res = await response.json();
      if (!response.ok || !res.success) {
        throw new Error(res.message || "Failed to record DPR");
      }

      setStatus("success:Daily progress entry recorded directly to Google Sheet 'Input '!");
      setEntries((prev) => [
        {
          id: `new-${Date.now()}`,
          timestamp: new Date().toISOString(),
          date: dateOfDpr,
          lineCode,
          itemDescription,
          actualQty,
          manpower,
          remarks: remark,
          enteredBy: "Site Engineer",
          uploadDocument,
        },
        ...prev,
      ]);

      setActualQty("");
      setManpower("");
      setRemark("");
    } catch (err) {
      setStatus(`error:${err instanceof Error ? err.message : "Failed to record DPR."}`);
    } finally {
      setSubmitting(false);
    }
  }

  // Filter history entries by search query
  const filteredEntries = entries.filter((entry) => {
    if (!searchTable) return true;
    const query = searchTable.toLowerCase();
    return (
      entry.lineCode.toLowerCase().includes(query) ||
      entry.itemDescription.toLowerCase().includes(query) ||
      entry.date.toLowerCase().includes(query) ||
      entry.remarks.toLowerCase().includes(query)
    );
  });

  return (
    <main className="min-h-screen bg-slate-50/60 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <header className="rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl shadow-slate-950/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Google Sheet Tab: 'Input '</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Daily Progress Reporting (DPR)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Select verified BOQ Line Items to log executed quantities, deployed labor, and site remarks
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
          {/* Left Form: 5 cols */}
          <div className="lg:col-span-5 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">New Daily Log</h2>
                <p className="text-xs text-slate-500">Submits a verified row to 'Input '</p>
              </div>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <PlusCircle className="h-5 w-5" />
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
              {/* Step 1: Job Card Filter */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1 flex items-center justify-between">
                  <span>1. Job Card Filter (Optional)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Filters BOQ items</span>
                </label>
                <select
                  value={selectedJobCard}
                  onChange={(e) => setSelectedJobCard(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition"
                >
                  <option value="">
                    {loading ? "Loading job cards..." : `-- All Job Cards (${jobCards.length}) --`}
                  </option>
                  {jobCards.map((j) => (
                    <option key={j.jobCardNo} value={j.jobCardNo}>
                      {j.jobCardNo}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Line Code */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  2. Line Code & Activity (from BOQ) *
                </label>
                <select
                  required
                  value={lineCode}
                  onChange={(e) => handleLineCodeSelect(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 font-mono text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition"
                >
                  <option value="">
                    {loading ? "Loading BOQ codes..." : "-- Select BOQ Line Code --"}
                  </option>
                  {filteredBoq.map((b) => (
                    <option key={b.lineCode} value={b.lineCode}>
                      {b.lineCode} - {b.itemDescription.substring(0, 40)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 3: Auto-populated Description */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Item Description
                </label>
                <textarea
                  readOnly
                  rows={2}
                  value={itemDescription}
                  className="w-full rounded-xl border border-slate-200 bg-slate-100/80 p-2.5 text-xs text-slate-600 outline-none cursor-not-allowed"
                  placeholder="Auto-populated from BOQ master..."
                />
              </div>

              {/* Date & Quantity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Date Of DPR *</label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={dateOfDpr}
                      onChange={(e) => setDateOfDpr(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/80 p-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Actual Qty Executed *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 50"
                    value={actualQty}
                    onChange={(e) => setActualQty(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 p-2 text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Manpower */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1 flex items-center justify-between">
                  <span>Manpower Count (Labor deployed) *</span>
                  <span className="text-[10px] text-slate-400 font-normal">Persons</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    placeholder="e.g. 12"
                    value={manpower}
                    onChange={(e) => setManpower(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Site Remarks & Grid Location</label>
                <textarea
                  rows={2}
                  placeholder="Location, grid references, weather or delays..."
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition"
                />
              </div>

              {/* Evidence Link */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Document / Site Photo URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={uploadDocument}
                  onChange={(e) => setUploadDocument(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 p-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition font-mono"
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
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 p-3 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:from-indigo-500 hover:to-indigo-600 transition active:scale-95 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Appending to Google Sheets...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="h-4 w-4" />
                    <span>Save DPR Entry to Sheet</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Table: 7 cols */}
          <div className="lg:col-span-7 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Recorded DPR History</h2>
                  <p className="text-xs text-slate-500">Live stream directly from sheet 'Input '</p>
                </div>

                {/* Table search filter */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={searchTable}
                    onChange={(e) => setSearchTable(e.target.value)}
                    className="w-full sm:w-48 rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 outline-none transition"
                  />
                </div>
              </div>

              {loading ? (
                <div className="py-24 text-center">
                  <RefreshCw className="mx-auto h-6 w-6 text-indigo-600 animate-spin" />
                  <p className="mt-3 text-xs font-semibold text-slate-700">Loading DPR stream from Google Sheets...</p>
                </div>
              ) : filteredEntries.length === 0 ? (
                <div className="py-24 text-center">
                  <FileSpreadsheet className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-3 text-xs font-bold text-slate-700">No matching DPR rows found</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Submit the form to log your first record!</p>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold tracking-wider text-slate-500">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Line Code</th>
                        <th className="py-2.5 px-3">Activity Description</th>
                        <th className="py-2.5 px-3 text-right">Actual Qty</th>
                        <th className="py-2.5 px-3 text-right">Labor</th>
                        <th className="py-2.5 px-3">Remark</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredEntries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-800">
                            {entry.date || entry.timestamp.split(" ")[0]}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] font-bold text-indigo-700">
                            {entry.lineCode}
                          </td>
                          <td className="py-3 px-3 text-slate-700 max-w-[200px] truncate" title={entry.itemDescription}>
                            {entry.itemDescription}
                          </td>
                          <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                            {entry.actualQty}
                          </td>
                          <td className="py-3 px-3 text-right font-semibold text-slate-600">
                            {entry.manpower}
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
              <span>Showing {filteredEntries.length} of {entries.length} entries</span>
              <span>Updated within 60s</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
