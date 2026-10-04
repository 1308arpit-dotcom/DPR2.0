"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ManpowerEntry = {
  date: string;
  contractorName: string;
  category: string;
  resourceName: string;
  quantity: string;
  shift: string;
  remarks: string;
  submittedBy: string;
};

const initialForm: ManpowerEntry = {
  date: "",
  contractorName: "",
  category: "",
  resourceName: "",
  quantity: "",
  shift: "",
  remarks: "",
  submittedBy: "",
};

export default function ManpowerPage() {
  const [form, setForm] = useState(initialForm);
  const [entries, setEntries] = useState<ManpowerEntry[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEntries() {
      try {
        const response = await fetch("/api/manpower");
        const data = (await response.json()) as { items?: ManpowerEntry[] };
        setEntries(Array.isArray(data.items) ? data.items : []);
      } catch {
        setStatus("Unable to load manpower entries right now.");
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
      const response = await fetch("/api/manpower", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const result = (await response.json()) as { success?: boolean; message?: string };
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to submit manpower entry");
      }

      setEntries((current) => [form, ...current]);
      setForm(initialForm);
      setStatus("Manpower entry saved to Google Sheets.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to save manpower entry.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-emerald-600">Module</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">Manpower Entry</h1>
            </div>
            <Link href="/dashboard" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:border-emerald-200 hover:text-emerald-700">
              Back to Dashboard
            </Link>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-800">Add Manpower Entry</h2>
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-300" required />
                <input value={form.contractorName} onChange={(e) => setForm({ ...form, contractorName: e.target.value })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-300" placeholder="Contractor Name" required />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-300" placeholder="Category" required />
                <input value={form.resourceName} onChange={(e) => setForm({ ...form, resourceName: e.target.value })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-300" placeholder="Resource Name" required />
                <input value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-300" placeholder="Quantity" />
              </div>
              <input value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-300" placeholder="Shift (Day / Night)" />
              <textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} rows={3} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-300" placeholder="Remarks / Notes" />
              <input value={form.submittedBy} onChange={(e) => setForm({ ...form, submittedBy: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-300" placeholder="Submitted By" />

              {status && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{status}</p>}

              <button type="submit" className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500">Save to Google Sheet</button>
            </form>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-800">Recent Manpower Entries</h2>
            <div className="mt-5 overflow-x-auto">
              {loading ? <p className="text-sm text-slate-500">Loading entries…</p> : entries.length === 0 ? <p className="text-sm text-slate-500">No manpower entries yet.</p> : (
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Date</th>
                      <th className="px-3 py-2 font-semibold">Contractor</th>
                      <th className="px-3 py-2 font-semibold">Resource</th>
                      <th className="px-3 py-2 font-semibold">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry, index) => (
                      <tr key={`${entry.contractorName}-${entry.date}-${index}`} className="border-t border-slate-200">
                        <td className="px-3 py-2">{entry.date}</td>
                        <td className="px-3 py-2">{entry.contractorName}</td>
                        <td className="px-3 py-2">{entry.resourceName}</td>
                        <td className="px-3 py-2">{entry.quantity || "-"}</td>
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
