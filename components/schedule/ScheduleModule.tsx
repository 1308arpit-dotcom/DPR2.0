"use client";

import { useEffect, useMemo, useState } from "react";

export type ScheduleStatus = "Not Started" | "In Progress" | "Completed" | "Delayed";

export type ScheduleEntry = {
  milestone: string;
  startDate: string;
  endDate: string;
  contractor: string;
  status: ScheduleStatus;
  notes?: string;
};

const STATUS_STYLES: Record<ScheduleStatus, string> = {
  "Not Started": "bg-slate-100 text-slate-700 border-slate-200",
  "In Progress": "bg-blue-100 text-blue-700 border-blue-200",
  Completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Delayed: "bg-rose-100 text-rose-700 border-rose-200",
};

const DEFAULT_FORM = {
  milestone: "",
  startDate: "",
  endDate: "",
  contractor: "",
  status: "Not Started" as ScheduleStatus,
  notes: "",
};

const FALLBACK_ENTRIES: ScheduleEntry[] = [
  {
    milestone: "Foundation",
    startDate: "2026-09-01",
    endDate: "2026-09-14",
    contractor: "Alpha Build Co.",
    status: "Completed",
    notes: "Pile cap and raft work completed.",
  },
  {
    milestone: "Structure",
    startDate: "2026-09-15",
    endDate: "2026-10-20",
    contractor: "Skyline Structural Works",
    status: "In Progress",
    notes: "Column and slab casting ongoing.",
  },
  {
    milestone: "Finishing",
    startDate: "2026-10-21",
    endDate: "2026-11-30",
    contractor: "Urban Finishers",
    status: "Not Started",
    notes: "Waiting for structural handover.",
  },
  {
    milestone: "Handover",
    startDate: "2026-12-01",
    endDate: "2026-12-15",
    contractor: "Project Management Cell",
    status: "Delayed",
    notes: "Dependency on final inspection approval.",
  },
];

function formatDate(dateString: string) {
  if (!dateString) return "—";

  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) {
    return dateString;
  }

  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getTimelineProgress(entry: ScheduleEntry) {
  if (!entry.startDate || !entry.endDate) return 0;

  const start = new Date(entry.startDate).getTime();
  const end = new Date(entry.endDate).getTime();
  const now = Date.now();

  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 0;

  const range = end - start;
  const currentProgress = Math.min(Math.max(now - start, 0), range);
  return Math.round((currentProgress / range) * 100);
}

export default function ScheduleModule() {
  const [entries, setEntries] = useState<ScheduleEntry[]>(FALLBACK_ENTRIES);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [selectedEntry, setSelectedEntry] = useState<ScheduleEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/schedule");
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { items?: ScheduleEntry[] };

        if (Array.isArray(data.items) && data.items.length > 0) {
          setEntries(data.items);
        }
      } catch {
        setError("Using local fallback values because the live sheet feed is unavailable.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadSchedule();
  }, []);

  const totalProgress = useMemo(() => {
    if (!entries.length) return 0;

    const completed = entries.filter((entry) => entry.status === "Completed").length;
    return Math.round((completed / entries.length) * 100);
  }, [entries]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const payload = {
      ...form,
      milestone: form.milestone.trim(),
      contractor: form.contractor.trim() || "Unassigned",
    };

    try {
      const response = await fetch("/api/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as { success?: boolean; item?: ScheduleEntry; message?: string };

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to save milestone.");
      }

      const nextEntry = result.item ?? payload;

      setEntries((previous) => {
        const existingIndex = previous.findIndex(
          (entry) =>
            entry.milestone.toLowerCase() === nextEntry.milestone.toLowerCase(),
        );

        if (existingIndex >= 0) {
          const updated = [...previous];
          updated[existingIndex] = nextEntry;
          return updated;
        }

        return [nextEntry, ...previous];
      });

      setForm(DEFAULT_FORM);
      setSelectedEntry(null);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Something went wrong while saving this milestone.",
      );
    }
  }

  function handleEdit(entry: ScheduleEntry) {
    setSelectedEntry(entry);
    setForm({ ...entry, notes: entry.notes ?? "" });
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl bg-gradient-to-r from-indigo-700 via-violet-700 to-sky-600 p-6 text-white shadow-lg">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-indigo-100">Construction Management</p>
              <h1 className="mt-2 text-3xl font-bold">Schedule & Milestone Tracking</h1>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-indigo-100">Overall progress</p>
              <p className="mt-1 text-2xl font-semibold">{totalProgress}%</p>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Milestones", value: entries.length, accent: "bg-sky-50 text-sky-700" },
            { label: "In Progress", value: entries.filter((entry) => entry.status === "In Progress").length, accent: "bg-blue-50 text-blue-700" },
            { label: "Completed", value: entries.filter((entry) => entry.status === "Completed").length, accent: "bg-emerald-50 text-emerald-700" },
            { label: "Delayed", value: entries.filter((entry) => entry.status === "Delayed").length, accent: "bg-rose-50 text-rose-700" },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${card.accent}`}>
                {card.label}
              </div>
              <div className="mt-4 text-3xl font-bold text-slate-900">{card.value}</div>
            </div>
          ))}
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-800">Milestone Timeline</h2>
              {isLoading && <span className="text-sm text-slate-500">Syncing sheet…</span>}
            </div>

            <div className="mt-5 space-y-4">
              {entries.map((entry) => {
                const percent = getTimelineProgress(entry);

                return (
                  <div key={`${entry.milestone}-${entry.startDate}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-slate-800">{entry.milestone}</h3>
                          <span className={`rounded-full border px-2 py-1 text-xs font-medium ${STATUS_STYLES[entry.status]}`}>
                            {entry.status}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatDate(entry.startDate)} – {formatDate(entry.endDate)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleEdit(entry)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700"
                      >
                        Update
                      </button>
                    </div>

                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500">
                        <span>{entry.contractor}</span>
                        <span>{percent}%</span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-800">
              {selectedEntry ? "Update Milestone" : "Add New Milestone"}
            </h2>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Milestone</label>
                <input
                  value={form.milestone}
                  onChange={(event) => setForm((current) => ({ ...current, milestone: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-300 focus:bg-white"
                  placeholder="Foundation"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Start Date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-300 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">End Date</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-300 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Assigned Contractor</label>
                <input
                  value={form.contractor}
                  onChange={(event) => setForm((current) => ({ ...current, contractor: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-300 focus:bg-white"
                  placeholder="Alpha Build Co."
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Current Status</label>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value as ScheduleStatus,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-300 focus:bg-white"
                >
                  {Object.keys(STATUS_STYLES).map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-300 focus:bg-white"
                  placeholder="Work completed, dependencies, risk notes..."
                />
              </div>

              {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
                >
                  {selectedEntry ? "Save Changes" : "Add Milestone"}
                </button>
                {selectedEntry && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEntry(null);
                      setForm(DEFAULT_FORM);
                      setError("");
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-800">Project Schedule Table</h2>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-collapse text-left">
              <thead className="bg-slate-100 text-sm text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Milestone</th>
                  <th className="px-4 py-3 font-semibold">Start Date</th>
                  <th className="px-4 py-3 font-semibold">End Date</th>
                  <th className="px-4 py-3 font-semibold">Assigned Contractor</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={`${entry.milestone}-${entry.startDate}`} className="border-t border-slate-200 text-sm text-slate-700">
                    <td className="px-4 py-3 font-medium text-slate-800">{entry.milestone}</td>
                    <td className="px-4 py-3">{formatDate(entry.startDate)}</td>
                    <td className="px-4 py-3">{formatDate(entry.endDate)}</td>
                    <td className="px-4 py-3">{entry.contractor}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 font-medium ${STATUS_STYLES[entry.status]}`}>
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
