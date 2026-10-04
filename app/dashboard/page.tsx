import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { getSessionFromCookie, type SessionUser } from "@/lib/auth";

const modules = {
  user: [
    { title: "DPR Logging", status: "Create DPR entries", href: "/dpr" },
    { title: "Hindrance Reporting", status: "Submit site issues", href: "/hinderance" },
    { title: "Manpower Entry", status: "Update labor and machinery", href: "/manpower" },
  ],
  admin: [
    { title: "DPR Logging", status: "View and manage", href: "/dpr" },
    { title: "Hindrance Reporting", status: "Review all site issues", href: "/hinderance" },
    { title: "Manpower Entry", status: "Audit labor and machinery", href: "/manpower" },
    { title: "Analytics Dashboard", status: "View project metrics", href: "/analytics" },
    { title: "Critical Updates", status: "Approve and remove entries", href: "/critical-updates" },
  ],
};

function formatRole(role: SessionUser["role"]) {
  return role === "admin" ? "Admin" : "User";
}

export default async function DashboardPage() {
  const session = getSessionFromCookie(await cookies());

  if (!session) {
    redirect("/login");
  }

  const availableModules = modules[session.role];

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-900 to-violet-900 p-6 text-white shadow-lg shadow-slate-200/80">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-indigo-200">Construction Portal</p>
              <h1 className="mt-2 text-3xl font-bold">Dashboard</h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-right backdrop-blur-sm">
                <p className="text-[10px] uppercase tracking-[0.2em] text-indigo-200">Logged in</p>
                <p className="mt-1 text-sm font-semibold">{session.name}</p>
                <p className="text-xs text-indigo-100">{formatRole(session.role)}</p>
              </div>
              <Link
                href="/login"
                className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20"
              >
                Login Page
              </Link>
              <LogoutButton />
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {availableModules.map((module) => (
            <Link
              key={module.title}
              href={module.href}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-indigo-600">Module</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-800">{module.title}</h2>
              <p className="mt-2 text-sm text-slate-500">{module.status}</p>
              <span className="mt-4 inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                Open module
              </span>
            </Link>
          ))}
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-800">Role permissions</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <h3 className="text-lg font-semibold text-slate-800">User access</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
                <li>DPR logging</li>
                <li>Hindrance reporting</li>
                <li>Manpower entry submission</li>
              </ul>
            </div>

            <div className="rounded-2xl bg-indigo-50 p-4">
              <h3 className="text-lg font-semibold text-indigo-700">Admin access</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-indigo-800">
                <li>All module visibility</li>
                <li>Analytics dashboard access</li>
                <li>Critical updates and deletions</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
