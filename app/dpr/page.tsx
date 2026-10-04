"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type DprEntry = {
  date: string;
  jobCardNumber: string;
  activityDescription: string;
  quantityExecuted: string;
  laborCount: string;
  remarks: string;
  submittedBy: string;
};

const initialForm: DprEntry = {
  date: "",
  jobCardNumber: "",
  activityDescription: "",
  quantityExecuted: "",
  laborCount: "",
  remarks: "",
  submittedBy: "",
};

export default function DprPage() {
  const [form, setForm] = useState(initialForm);
  const [entries, setEntries] = useState<DprEntry[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEntries() {
      try {
        const response = await fetch("/api/dpr");
        const data = (await response.json()) as { items?: DprEntry[] };
        setEntries(Array.isArray(data.items) ? data.items : []);
      } catch {
        setStatus("Unable to load DPR entries right now.");
      } finally {
        setLoading(false);
      }
    }

    void loadEntries();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    try {
      const response = await fetch("/api/dpr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const result = (await response.json()) as { success?: boolean; message?: string };
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to save DPR entry");
      }

      setEntries((current) => [form, ...current]);
      setForm(initialForm);
      setStatus("DPR entry saved to Google Sheets.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to save DPR entry.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-indigo-600">Module</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">DPR Logging</h1>
            </div>
            <Link href="/dashboard" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:border-indigo-200 hover:text-indigo-700">
              Back to Dashboard
            </Link>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-800">Add DPR Entry</h2>
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-indigo-300" placeholder="Date" required />
                <input value={form.jobCardNumber} onChange={(e) => setForm({ ...form, jobCardNumber: e.target.value })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-indigo-300" placeholder="Job Card Number" required />
              </div>
              <input value={form.activityDescription} onChange={(e) => setForm({ ...form, activityDescription: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-indigo-300" placeholder="Activity Description" required />
              <div className="grid gap-4 sm:grid-cols-2">
                <input value={form.quantityExecuted} onChange={(e) => setForm({ ...form, quantityExecuted: e.target.value })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-indigo-300" placeholder="Quantity Executed" />
                <input value={form.laborCount} onChange={(e) => setForm({ ...form, laborCount: e.target.value })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-indigo-300" placeholder="Labor Count" />
              </div>
              <textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} rows={3} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-indigo-300" placeholder="Remarks / Notes" />
              <input value={form.submittedBy} onChange={(e) => setForm({ ...form, submittedBy: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-indigo-300" placeholder="Submitted By" />

              {status && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{status}</p>}

              <button type="submit" className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500">Save to Google Sheet</button>
            </form>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-800">Recent DPR Entries</h2>
            <div className="mt-5 overflow-x-auto">
              {loading ? <p className="text-sm text-slate-500">Loading entries…</p> : entries.length === 0 ? <p className="text-sm text-slate-500">No DPR entries yet.</p> : (
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Date</th>
                      <th className="px-3 py-2 font-semibold">Job Card</th>
                      <th className="px-3 py-2 font-semibold">Activity</th>
                      <th className="px-3 py-2 font-semibold">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry, index) => (
                      <tr key={`${entry.jobCardNumber}-${entry.date}-${index}`} className="border-t border-slate-200">
                        <td className="px-3 py-2">{entry.date}</td>
                        <td className="px-3 py-2">{entry.jobCardNumber}</td>
                        <td className="px-3 py-2">{entry.activityDescription}</td>
                        <td className="px-3 py-2">{entry.quantityExecuted || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
