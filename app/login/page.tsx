"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/AuthProvider";

const ROLE_OPTIONS = [
  { value: "user", label: "User" },
  { value: "admin", label: "Admin" },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [role, setRole] = useState<"user" | "admin">("user");
  const [username, setUsername] = useState("siteengineer");
  const [pin, setPin] = useState("site123");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
        throw new Error(result.message || "Login failed.");
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
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/60">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600">
            Construction Portal
          </p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">Sign in</h1>
          <p className="mt-2 text-sm text-slate-500">Select a role and continue with your credentials</p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
          {ROLE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setRole(option.value as "user" | "admin")}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                role === option.value
                  ? "bg-white text-indigo-700 shadow-sm ring-1 ring-indigo-200"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-slate-700">
              Username
            </label>
            <input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:bg-white"
              placeholder={role === "admin" ? "projectmanager" : "siteengineer"}
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label htmlFor="pin" className="mb-1.5 block text-sm font-medium text-slate-700">
              PIN / Password
            </label>
            <input
              id="pin"
              type="password"
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:bg-white"
              placeholder={role === "admin" ? "admin123" : "site123"}
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-400"
          >
            {isSubmitting ? "Signing in..." : `Login as ${role === "admin" ? "Admin" : "User"}`}
          </button>
        </form>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          <p className="font-semibold text-slate-700">Demo credentials</p>
          <div className="mt-2 space-y-1">
            <p>User: username = siteengineer / pin = site123</p>
            <p>Admin: username = projectmanager / pin = admin123</p>
          </div>
        </div>
      </div>
    </main>
  );
}
