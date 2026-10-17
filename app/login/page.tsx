"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  HardHat,
  ShieldCheck,
  User,
  KeyRound,
  ArrowRight,
  Database,
  CheckCircle2,
  Lock,
  Sparkles,
} from "lucide-react";

import { useAuth } from "@/components/auth/AuthProvider";

const ROLES = [
  {
    id: "user" as const,
    label: "Site Engineer",
    sublabel: "Daily DPR & Hindrances",
    username: "siteengineer",
    pin: "site123",
  },
  {
    id: "admin" as const,
    label: "Project Manager",
    sublabel: "Analytics & Approvals",
    username: "projectmanager",
    pin: "admin123",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [role, setRole] = useState<"user" | "admin">("user");
  const [username, setUsername] = useState("siteengineer");
  const [pin, setPin] = useState("site123");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleSelectRole(newRole: "user" | "admin") {
    setRole(newRole);
    const target = ROLES.find((r) => r.id === newRole);
    if (target) {
      setUsername(target.username);
      setPin(target.pin);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, username, pin }),
      });

      const result = (await response.json()) as {
        success?: boolean;
        message?: string;
        user?: {
          username: string;
          name: string;
          role: "user" | "admin";
        };
      };

      if (!response.ok || !result.success || !result.user) {
        throw new Error(result.message || "Invalid credentials. Please verify your username and PIN.");
      }

      login(result.user);
      router.push("/dashboard");
      router.refresh();
    } catch (loginError) {
      setError(
        loginError instanceof Error ? loginError.message : "Something went wrong while signing in.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12 text-slate-100">
      {/* Ambient background glows & grid overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.25),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-violet-600/15 blur-3xl pointer-events-none" />

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-950/60 px-3 py-1 text-xs font-semibold text-indigo-300 backdrop-blur-md mb-4 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Google Spreadsheet Live Connected</span>
          </div>

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white shadow-xl shadow-indigo-500/25 ring-4 ring-white/10">
            <HardHat className="h-7 w-7" />
          </div>

          <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            EPACK Construction
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            DPR 2.0 • Real-time Daily Progress & Resource System
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl shadow-black/60">
          <div className="mb-6">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
              1. Choose Access Role
            </label>
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-950/60 p-1.5 border border-white/5">
              {ROLES.map((r) => {
                const isSelected = role === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleSelectRole(r.id)}
                    className={`rounded-xl p-2.5 text-left transition-all ${
                      isSelected
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{r.label}</span>
                      {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-indigo-200" />}
                    </div>
                    <p className={`text-[10px] mt-0.5 ${isSelected ? "text-indigo-100" : "text-slate-500"}`}>
                      {r.sublabel}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Username</span>
                <span className="text-[10px] font-normal text-slate-400">Autofilled for quick access</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/70 py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-600 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Enter employee code or username"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="pin" className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>PIN / Password</span>
                <span className="text-[10px] font-normal text-slate-400">Security PIN</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="pin"
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/70 py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-600 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Enter PIN"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-950/50 p-3 text-xs font-medium text-rose-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 transition-all hover:opacity-95 hover:shadow-indigo-600/50 active:scale-[0.98] disabled:opacity-60"
            >
              {isSubmitting ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Enter Portal as {role === "admin" ? "Project Manager" : "Site Engineer"}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Connected Metadata Footer */}
          <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-indigo-400" />
              <span>Sheet: Copy of DPR Tool v2</span>
            </div>
            <span className="text-slate-500">Fast 60s Cache</span>
          </div>
        </div>
      </div>
    </main>
  );
}
