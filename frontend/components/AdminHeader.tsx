"use client";

import React from "react";
import { Menu, Bell, User } from "lucide-react";
import { getStoredUser } from "@/lib/api";

interface AdminHeaderProps {
  onToggleSidebar: () => void;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  onToggleSidebar,
  title,
  subtitle,
  actions,
}) => {
  const user = getStoredUser();

  return (
    <header className="sticky top-0 z-30 flex h-16 sm:h-20 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-8 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          {title && <h1 className="text-base sm:text-xl font-bold text-slate-900">{title}</h1>}
          {subtitle && <p className="text-xs text-slate-500 hidden sm:block">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {actions}
        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="text-right">
            <div className="text-xs font-semibold text-slate-800">
              {user?.full_name || "Admin"}
            </div>
            <div className="text-[10px] text-foundation-700 font-medium">
              {user?.role?.name || "Super Admin"}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
