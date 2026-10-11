"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Load master data and existing DPR rows in parallel
        const [masterRes, dprRes] = await Promise.all([
          fetch("/api/master"),
          fetch("/api/dpr"),
        ]);

        const masterData = await masterRes.json();
        const dprData = await dprRes.json();

        if (masterData.success) {
          setJobCards(masterData.jobCards || []);
          setBoqList(masterData.boq || []);
        } else {
          setStatus(masterData.message || "Unable to load master dropdown data from Google Sheets.");
        }

        if (dprData.success) {
          setEntries(dprData.items || []);
        } else if (!masterData.message) {
          setStatus(dprData.message || "Unable to load DPR entries.");
        }
      } catch (err) {
        console.error(err);
        setStatus(err instanceof Error ? err.message : "Failed to load initial sheet data.");
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

  // When job card changes, filter BOQ items
  useEffect(() => {
    if (selectedJobCard) {
      const filtered = boqList.filter(
        (b) => b.jobCard.toLowerCase() === selectedJobCard.toLowerCase()
      );
      setFilteredBoq(filtered);
    } else {
      setFilteredBoq(boqList.slice(0, 50));
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

      setStatus("✅ Successfully recorded to 'Input ' sheet!");
      // Prepend to current list
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

      // Reset specific inputs
      setActualQty("");
      setManpower("");
      setRemark("");
    } catch (err) {
      setStatus(err instanceof Error ? `❌ ${err.message}` : "Failed to record DPR.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-indigo-600">
              Module • Google Sheet Tab: 'Input '
            </span>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">DPR Logging</h1>
            <p className="mt-1 text-sm text-slate-500">
              Select Line Code from BOQ to record daily progress and manpower
            </p>
          </div>
          <Link
            href="/dashboard"
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            ← Back to Dashboard
          </Link>
        </header>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Form */}
          <div className="lg:col-span-1 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">New DPR Entry</h2>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  1. Filter by Job Card (Optional)
                </label>
                <select
                  value={selectedJobCard}
                  onChange={(e) => setSelectedJobCard(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 text-slate-900"
                >
                  <option value="">
                    {loading
                      ? "Loading job cards from sheet..."
                      : jobCards.length === 0
                      ? "-- No Job Cards Found (Check Vercel env vars) --"
                      : `-- All Job Cards (${jobCards.length}) --`}
                  </option>
                  {jobCards.map((j) => (
                    <option key={j.jobCardNo} value={j.jobCardNo}>
                      {j.jobCardNo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  2. Line Code & Activity (from BOQ) *
                </label>
                <select
                  required
                  value={lineCode}
                  onChange={(e) => handleLineCodeSelect(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 text-slate-900 font-mono text-xs"
                >
                  <option value="">
                    {loading
                      ? "Loading line codes from sheet..."
                      : filteredBoq.length === 0
                      ? "-- No Line Codes Found --"
                      : "-- Select Line Code --"}
                  </option>
                  {filteredBoq.map((b) => (
                    <option key={b.lineCode} value={b.lineCode}>
                      {b.lineCode} - {b.itemDescription.substring(0, 35)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Activity Description
                </label>
                <textarea
                  readOnly
                  rows={2}
                  value={itemDescription}
                  className="w-full rounded-xl border border-slate-200 p-2 bg-slate-100 text-slate-600 text-xs"
                  placeholder="Auto-populated from BOQ..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={dateOfDpr}
                    onChange={(e) => setDateOfDpr(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 bg-slate-50 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Actual Qty *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 50"
                    value={actualQty}
                    onChange={(e) => setActualQty(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 bg-slate-50 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Manpower Count (Labor deployed) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 12"
                  value={manpower}
                  onChange={(e) => setManpower(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 bg-slate-50 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Remark</label>
                <textarea
                  rows={2}
                  placeholder="Observations, grid location, hindrances..."
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 bg-slate-50 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document / Photo URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={uploadDocument}
                  onChange={(e) => setUploadDocument(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 bg-slate-50 text-slate-900 text-xs"
                />
              </div>

              {status && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium ${
                    status.startsWith("✅")
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  {status}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {submitting ? "Saving to Sheet..." : "Save DPR Entry"}
              </button>
            </form>
          </div>

          {/* Table */}
          <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Recorded DPR History</h2>
                <p className="text-xs text-slate-500">
                  Direct live stream from sheet: <strong>'Input '</strong>
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {entries.length} Entries
              </span>
            </div>

            {loading ? (
              <div className="py-20 text-center text-sm text-slate-500">Loading entries...</div>
            ) : entries.length === 0 ? (
              <div className="py-20 text-center text-sm text-slate-500">
                No DPR entries in 'Input ' yet. Use the form to submit the first entry!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Line Code</th>
                      <th className="py-3 px-3">Item Description</th>
                      <th className="py-3 px-3">Actual Qty</th>
                      <th className="py-3 px-3">Manpower</th>
                      <th className="py-3 px-3">Remark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-800">
                          {entry.date || entry.timestamp}
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-indigo-700 whitespace-nowrap">
                          {entry.lineCode}
                        </td>
                        <td className="py-3 px-3 max-w-xs truncate text-slate-700" title={entry.itemDescription}>
                          {entry.itemDescription}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900">{entry.actualQty}</td>
                        <td className="py-3 px-3">{entry.manpower}</td>
                        <td className="py-3 px-3 text-slate-500 max-w-xs truncate" title={entry.remarks}>
                          {entry.remarks || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
