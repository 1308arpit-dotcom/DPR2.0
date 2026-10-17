"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { useAuth } from "@/components/auth/AuthProvider";

export function LogoutButton() {
  const router = useRouter();
  const { logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 active:scale-95"
      title="Sign out of account"
    >
      <LogOut className="h-3.5 w-3.5" />
      <span>Logout</span>
    </button>
  );
}

