"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  FileSpreadsheet,
  AlertOctagon,
  Truck,
  CalendarDays,
  BarChart3,
  ShieldAlert,
  LogOut,
  Menu,
  X,
  HardHat,
  Sparkles,
} from "lucide-react";

import { useAuth } from "@/components/auth/AuthProvider";
import { LogoutButton } from "@/components/auth/LogoutButton";

export function Navbar() {
  const pathname = usePathname();
  const { session } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If user is on /login, don't show the main navbar
  if (pathname === "/login") {
    return null;
  }

  const role = session?.role || "user";
  const name = session?.name || (role === "admin" ? "Project Manager" : "Site Engineer");

  const navLinks = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["user", "admin"],
    },
    {
      title: "DPR Logging",
      href: "/dpr",
      icon: FileSpreadsheet,
      badge: "Input",
      roles: ["user", "admin"],
    },
    {
      title: "Hindrances",
      href: "/hinderance",
      icon: AlertOctagon,
      badge: "Issues",
      roles: ["user", "admin"],
    },
    {
      title: "Plant & Labor",
      href: "/manpower",
      icon: Truck,
      roles: ["user", "admin"],
    },
    {
      title: "Schedules",
      href: "/schedule",
      icon: CalendarDays,
      roles: ["user", "admin"],
    },
    {
      title: "Analytics",
      href: "/analytics",
      icon: BarChart3,
      roles: ["admin"],
    },
    {
      title: "Critical Review",
      href: "/critical-updates",
      icon: ShieldAlert,
      roles: ["admin"],
    },
  ];

  const visibleLinks = navLinks.filter((item) => item.roles.includes(role));

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand & Live Sheets Pill */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <HardHat className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                  EPACK
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md">
                  DPR 2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Construction Cloud</p>
            </div>
          </Link>

          {/* Live Sync Status indicator */}
          <div className="hidden lg:flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/70 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span>Google Sheets Live</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {visibleLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-indigo-400" : "text-slate-400"}`} />
                <span>{link.title}</span>
                {link.badge && !isActive && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-500">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Actions */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-1.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-700">
              {name.charAt(0)}
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-800 leading-tight">{name}</p>
              <div className="flex items-center gap-1">
                <span
                  className={`inline-block h-1.5 w-1.5 rounded-full ${
                    role === "admin" ? "bg-amber-500" : "bg-indigo-500"
                  }`}
                />
                <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">
                  {role === "admin" ? "Project Manager" : "Site Engineer"}
                </span>
              </div>
            </div>
          </div>

          <LogoutButton />
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200/80 bg-white px-4 py-4 md:hidden">
          <div className="mb-3 flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-700">
                {name.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">{name}</p>
                <p className="text-[10px] text-slate-500 uppercase">{role}</p>
              </div>
            </div>
            <LogoutButton />
          </div>

          <div className="space-y-1">
            {visibleLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
