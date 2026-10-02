"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminHeader } from "@/components/AdminHeader";
import { AdminSidebar } from "@/components/AdminSidebar";
import { getAuthToken } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push("/login");
    } else {
      setCheckingAuth(false);
    }
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Loading Management System...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased transition-colors">
      {/* 1. Full-width Management Header across top */}
      <AdminHeader onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

      {/* 2. Management Body: Persistent Left Sidebar + Scrollable Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 transition-colors">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
