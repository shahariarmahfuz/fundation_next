"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  LogOut,
  User as UserIcon,
  Moon,
  Sun,
  UserCog,
  Settings
} from "lucide-react";
import { getStoredUser, removeAuthToken } from "@/lib/api";
import { useTheme } from "@/lib/theme";
import { UserProfileModal } from "./UserProfileModal";

interface AdminHeaderProps {
  onToggleSidebar: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onToggleSidebar }) => {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

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

  const userAvatarInitial = user?.full_name
    ? user.full_name.charAt(0).toUpperCase()
    : user?.username
    ? user.username.charAt(0).toUpperCase()
    : "A";

  const canManageUsers =
    user?.is_superuser ||
    user?.role?.name === "Super Admin" ||
    user?.role?.permissions?.some((p: any) => p.code === "users.view" || p.code === "users.manage");

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-3 sm:px-6 text-slate-800 backdrop-blur-md shadow-sm dark:border-slate-800 dark:bg-slate-900/95 dark:text-white select-none transition-colors">
        {/* Left side: Sidebar Toggle ☰ + Foundation Brand (No decorative / shield icon) */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button
            onClick={onToggleSidebar}
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors shrink-0 cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Foundation Brand Typography */}
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2 group min-w-0"
          >
            <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-tight truncate">
              Al-Birr Foundation
            </span>
          </Link>
        </div>

        {/* Right side: Light/Dark Theme Toggle ☀/☾ + User Profile Avatar [ F ] */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Direct Light/Dark Theme Toggle in Header (Clean icon-focused button) */}
          <button
            onClick={toggleTheme}
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-amber-400 dark:hover:text-amber-300 dark:hover:bg-slate-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors cursor-pointer"
            aria-label={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5 text-amber-400" />
            ) : (
              <Moon className="h-5 w-5 text-slate-700" />
            )}
          </button>

          {/* Current User Profile Avatar [ F ] (Triggers Profile Menu) */}
          <div className="relative" ref={dropdownRef}>
            <button
              id="user-menu-button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              type="button"
              className="flex h-9 w-9 sm:h-9.5 sm:w-9.5 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-sm hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 transition-all cursor-pointer"
              aria-label="User account menu"
              aria-haspopup="menu"
              aria-expanded={dropdownOpen}
            >
              {userAvatarInitial}
            </button>

            {/* Profile Dropdown Popover */}
            {dropdownOpen && (
              <div
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="user-menu-button"
                className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-1.5rem)] origin-top-right rounded-2xl border border-slate-200 bg-white p-2 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-150 z-50 text-slate-800 dark:text-slate-100"
              >
                {/* 1. Current User Information */}
                <div className="flex items-center gap-3 p-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-sm font-bold shadow-sm">
                    {userAvatarInitial}
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

                {/* 2. Profile Actions */}
                <div className="py-1 space-y-0.5 text-xs">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      setProfileModalOpen(true);
                    }}
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white transition-colors text-left cursor-pointer"
                  >
                    <UserIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>My Profile</span>
                  </button>

                  <Link
                    href="/admin/settings"
                    onClick={() => setDropdownOpen(false)}
                    role="menuitem"
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white transition-colors"
                  >
                    <Settings className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>Account Settings</span>
                  </Link>

                  {canManageUsers && (
                    <Link
                      href="/admin/users"
                      onClick={() => setDropdownOpen(false)}
                      role="menuitem"
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white transition-colors"
                    >
                      <UserCog className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>User Management</span>
                    </Link>
                  )}
                </div>

                {/* 3. Log Out with Confirmation */}
                <div className="pt-1 mt-1 border-t border-slate-100 dark:border-slate-800">
                  {!confirmLogout ? (
                    <button
                      onClick={() => setConfirmLogout(true)}
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30 transition-colors text-left cursor-pointer"
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
                          className="flex-1 rounded bg-rose-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-rose-700 transition-colors cursor-pointer"
                        >
                          Confirm Logout
                        </button>
                        <button
                          onClick={() => setConfirmLogout(false)}
                          type="button"
                          className="flex-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
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
