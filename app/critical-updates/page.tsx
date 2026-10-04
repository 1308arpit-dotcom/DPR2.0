"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadItems() {
    try {
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
      setStatus(data.message || "Updated successfully.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to process critical update.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-red-600">Admin</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">Critical Updates</h1>
            </div>
            <Link href="/dashboard" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:border-red-200 hover:text-red-700">
              Back to Dashboard
            </Link>
          </div>
        </header>

        {status && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {status}
          </div>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-800">Pending review queue</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.15em] text-slate-600">
              {items.length} items
            </span>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Loading updates…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-slate-500">No critical updates pending.</p>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-red-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-red-700">
                          {item.module}
                        </span>
                        <span className="text-xs text-slate-500">{item.date}</span>
                      </div>
                      <h3 className="mt-2 text-lg font-semibold text-slate-800">{item.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">{item.summary}</p>
                      <p className="mt-2 text-xs text-slate-500">Submitted by: {item.submittedBy}</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void updateAction("approve", item)}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => void updateAction("delete", item)}
                        className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
