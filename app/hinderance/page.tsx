"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
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
    }

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

      setStatus("✅ Hindrance successfully logged to 'Add Hindrance' sheet!");
      setEntries((prev) => [
        {
          id: `HIN-NEW`,
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
      setStatus(err instanceof Error ? `❌ ${err.message}` : "Failed to record hindrance.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-rose-600">
              Module • Google Sheet Tab: 'Add Hindrance'
            </span>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">Hindrance Reporting</h1>
            <p className="mt-1 text-sm text-slate-500">
              Report site delays, vendor shortages, and client clearances
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
            <h2 className="text-lg font-bold text-slate-900 mb-4">Report New Issue</h2>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Job Card No *
                </label>
                <select
                  required
                  value={jobCardNo}
                  onChange={(e) => setJobCardNo(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 text-slate-900 font-mono text-xs"
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Start Date Of Hindrance *
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 bg-slate-50 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hindrance Type (from Legend Master) *
                </label>
                <select
                  required
                  value={selectHindrance}
                  onChange={(e) => setSelectHindrance(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 text-slate-900 text-xs"
                >
                  <option value="">-- Select Issue Type ({categories.length}) --</option>
                  {categories.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Remark *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain why the work is stopped or slowed down..."
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 bg-slate-50 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Upload Document / Evidence URL
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
                className="w-full rounded-xl bg-rose-600 px-4 py-2.5 font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
              >
                {submitting ? "Submitting Issue..." : "Submit Hindrance"}
              </button>
            </form>
          </div>

          {/* Table */}
          <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Recorded Hindrances</h2>
                <p className="text-xs text-slate-500">
                  Direct live stream from sheet: <strong>'Add Hindrance'</strong>
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {entries.length} Issues
              </span>
            </div>

            {loading ? (
              <div className="py-20 text-center text-sm text-slate-500">Loading hindrances...</div>
            ) : entries.length === 0 ? (
              <div className="py-20 text-center text-sm text-slate-500">
                No hindrances recorded in 'Add Hindrance'.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Job Card</th>
                      <th className="py-3 px-3">Issue Category</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Remark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-800">
                          {entry.startDate}
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-indigo-700 whitespace-nowrap">
                          {entry.jobCardNo}
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-900">{entry.hindrance}</td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              entry.status === "Closed"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {entry.status || "Open"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 max-w-xs truncate" title={entry.remarks}>
                          {entry.remarks}
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
