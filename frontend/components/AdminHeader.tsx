"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  Shield,
  ExternalLink,
  LogOut,
  User as UserIcon,
  ChevronRight,
  Database,
  Moon,
  Sun,
  Laptop,
  Check,
  UserCog,
  Settings
} from "lucide-react";
import { getStoredUser, removeAuthToken } from "@/lib/api";
import { useTheme, ThemeMode } from "@/lib/theme";
import { UserProfileModal } from "./UserProfileModal";

interface AdminHeaderProps {
  onToggleSidebar: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onToggleSidebar }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const [user, setUser] = useState<any | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
        setConfirmLogout(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDropdownOpen(false);
        setConfirmLogout(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [dropdownOpen]);

  const handleLogout = () => {
    removeAuthToken();
    router.push("/login");
  };

  // Human-readable breadcrumb
  const getBreadcrumbTitle = () => {
    if (!pathname) return "Dashboard";
    const segment = pathname.split("/").filter(Boolean)[1];
    if (!segment) return "Dashboard";

    const titles: Record<string, string> = {
      dashboard: "Executive Dashboard",
      members: "Member Directory",
      applications: "Member Applications",
      groups: "Accounting Groups",
      contributions: "Monthly Contributions",
      beneficiaries: "Welfare Beneficiaries",
      "qard-hasan": "Qard Hasan (0% Loans)",
      sadakah: "Sadakah Assistance",
      expenses: "Expenditure & Outflows",
      donations: "Donations & Donors",
      ledgers: "General & Group Ledgers",
      reports: "Financial Reports",
      settings: "Organization & CMS Settings",
      users: "Users, Roles & Access",
      "audit-logs": "System Audit Trail",
    };

    return titles[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-3 sm:px-6 text-slate-800 backdrop-blur-md shadow-sm dark:border-slate-800 dark:bg-slate-900/95 dark:text-white select-none transition-colors">
        {/* Left side: Hamburger (mobile) + Brand + Breadcrumbs */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button
            onClick={onToggleSidebar}
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white transition-colors lg:hidden shrink-0"
            aria-label="Toggle navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Foundation Portal Brand */}
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2.5 shrink-0 group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-900/40 group-hover:bg-emerald-500 transition-colors">
              <Shield className="h-5 w-5" />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                Al-Birr Foundation
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold tracking-wide uppercase">
                Management Portal
              </span>
            </div>
          </Link>

          {/* Breadcrumb separator on medium+ screens */}
          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-800 text-xs text-slate-400">
            <span className="text-slate-500 dark:text-slate-400">Portal</span>
            <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-600" />
            <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{getBreadcrumbTitle()}</span>
          </div>
        </div>

        {/* Right side: Database status + Public website + Clickable Avatar (NO standalone logout button) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Live Database status indicator (desktop only) */}
          <div className="hidden xl:flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <Database className="h-3 w-3" />
            <span>PostgreSQL Live</span>
          </div>

          {/* Public Website Button */}
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white transition-colors"
            title="Visit Public Website"
          >
            <ExternalLink className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Public Site</span>
          </Link>

          {/* Clickable Profile Avatar with Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              type="button"
              className="flex items-center gap-2 rounded-full p-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer group"
              aria-label="User profile and menu"
              aria-expanded={dropdownOpen}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold shadow-sm group-hover:ring-2 group-hover:ring-emerald-400 transition-all">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : <UserIcon className="h-4 w-4" />}
              </div>
              <div className="hidden lg:flex flex-col text-left pr-1">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight max-w-[120px] truncate">
                  {user?.full_name || user?.username || "Admin"}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium leading-tight">
                  {user?.role?.name || (user?.is_superuser ? "Super Admin" : "Staff")}
                </span>
              </div>
            </button>

            {/* Profile Dropdown Popover */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-2xl border border-slate-200 bg-white p-2 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-150 z-50 text-slate-800 dark:text-slate-100">
                {/* User Header Block */}
                <div className="flex items-center gap-3 p-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-sm font-bold shadow-sm">
                    {user?.full_name ? user.full_name.charAt(0).toUpperCase() : <UserIcon className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {user?.full_name || user?.username || "Management User"}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {user?.email || "user@foundation.org"}
                    </p>
                    <div className="mt-1">
                      <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                        Role: {user?.role?.name || (user?.is_superuser ? "Super Admin" : "Staff")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Navigation Options */}
                <div className="py-1 space-y-0.5 text-xs">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      setProfileModalOpen(true);
                    }}
                    type="button"
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white transition-colors text-left"
                  >
                    <UserIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>My Profile</span>
                  </button>

                  <Link
                    href="/admin/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white transition-colors"
                  >
                    <Settings className="h-4 w-4 text-slate-400 dark:text-slate-400 shrink-0" />
                    <span>Account Settings</span>
                  </Link>

                  {user?.is_superuser && (
                    <Link
                      href="/admin/users"
                      onClick={() => setDropdownOpen(false)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white transition-colors"
                    >
                      <UserCog className="h-4 w-4 text-slate-400 dark:text-slate-400 shrink-0" />
                      <span>User Management</span>
                    </Link>
                  )}
                </div>

                {/* Appearance / Theme Switcher */}
                <div className="pt-2 pb-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Appearance / Theme
                  </div>
                  <div className="grid grid-cols-3 gap-1 px-2">
                    {[
                      { mode: "light" as ThemeMode, label: "Light", icon: Sun },
                      { mode: "dark" as ThemeMode, label: "Dark", icon: Moon },
                      { mode: "system" as ThemeMode, label: "System", icon: Laptop },
                    ].map(({ mode, label, icon: Icon }) => {
                      const isActive = theme === mode;
                      return (
                        <button
                          key={mode}
                          onClick={() => setTheme(mode)}
                          type="button"
                          className={`flex flex-col items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-medium transition-all ${
                            isActive
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-500/30"
                              : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Logout Action */}
                <div className="pt-1 mt-1 border-t border-slate-100 dark:border-slate-800">
                  {!confirmLogout ? (
                    <button
                      onClick={() => setConfirmLogout(true)}
                      type="button"
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30 transition-colors text-left"
                    >
                      <LogOut className="h-4 w-4 shrink-0" />
                      <span>Log Out</span>
                    </button>
                  ) : (
                    <div className="p-2 space-y-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40">
                      <p className="text-[11px] text-rose-700 dark:text-rose-300 font-medium">
                        Are you sure you want to end your session?
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleLogout}
                          type="button"
                          className="flex-1 rounded bg-rose-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-rose-700 transition-colors"
                        >
                          Confirm Logout
                        </button>
                        <button
                          onClick={() => setConfirmLogout(false)}
                          type="button"
                          className="flex-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onUserUpdated={(updated) => setUser(updated)}
      />
    </>
  );
};
