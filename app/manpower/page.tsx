"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
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
    }

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

      setStatus("✅ Recorded to 'Machinery Input' sheet!");
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
      setStatus(err instanceof Error ? `❌ ${err.message}` : "Failed to record entry.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-blue-600">
              Module • Google Sheet Tab: 'Machinery Input'
            </span>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">Manpower & Machinery Tracking</h1>
            <p className="mt-1 text-sm text-slate-500">
              Log daily hydra, crane, and erection manpower counts
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
            <h2 className="text-lg font-bold text-slate-900 mb-4">New Entry</h2>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  1. Select Resource / Equipment (from Machinery Sheet) *
                </label>
                <select
                  required
                  value={tCode}
                  onChange={(e) => handleTCodeSelect(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 text-slate-900 font-mono text-xs"
                >
                  <option value="">-- Select T-Code ({machineryOptions.length}) --</option>
                  {machineryOptions.map((m) => (
                    <option key={m.tCode} value={m.tCode}>
                      {m.tCode} - {m.itemDescription.substring(0, 32)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  readOnly
                  rows={2}
                  value={itemDescription}
                  className="w-full rounded-xl border border-slate-200 p-2 bg-slate-100 text-slate-600 text-xs"
                  placeholder="Auto-populated..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 bg-slate-50 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Job Card No *
                  </label>
                  <select
                    required
                    value={jobCardNo}
                    onChange={(e) => setJobCardNo(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 bg-slate-50 text-slate-900 text-xs"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Current Actual *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 2"
                    value={currentActual}
                    onChange={(e) => setCurrentActual(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 bg-slate-50 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Plan Qty
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 2"
                    value={planQty}
                    onChange={(e) => setPlanQty(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 bg-slate-50 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Remark</label>
                <textarea
                  rows={2}
                  placeholder="Operator name, shift, or breakdown notes..."
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 bg-slate-50 text-slate-900"
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
                className="w-full rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Save Entry"}
              </button>
            </form>
          </div>

          {/* Table */}
          <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Recorded Machinery & Labor</h2>
                <p className="text-xs text-slate-500">
                  Direct live stream from sheet: <strong>'Machinery Input'</strong>
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
                No entries in 'Machinery Input' yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Job Card</th>
                      <th className="py-3 px-3">T-Code</th>
                      <th className="py-3 px-3">Item Description</th>
                      <th className="py-3 px-3">Actual</th>
                      <th className="py-3 px-3">Plan</th>
                      <th className="py-3 px-3">Remark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-800">
                          {entry.date}
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-indigo-700 whitespace-nowrap">
                          {entry.jobCardNo}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-800">{entry.tCode}</td>
                        <td className="py-3 px-3 max-w-xs truncate text-slate-700" title={entry.itemDescription}>
                          {entry.itemDescription}
                        </td>
                        <td className="py-3 px-3 font-bold text-blue-700">{entry.currentActual}</td>
                        <td className="py-3 px-3 text-slate-500">{entry.planQty || "—"}</td>
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
