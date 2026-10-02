"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FolderTree,
  Coins,
  Receipt,
  Gift,
  HandHeart,
  Scale,
  Heart,
  BookOpen,
  FileBarChart2,
  UserCheck,
  UserCog,
  Settings,
  History,
  LogOut,
  ChevronRight,
  Shield,
  Home
} from "lucide-react";
import { removeAuthToken, getStoredUser } from "@/lib/api";

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const AdminSidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const router = useRouter();
  const user = getStoredUser();

  const handleLogout = () => {
    removeAuthToken();
    router.push("/login");
  };

  const navSections = [
    {
      title: "Core Operations",
      items: [
        { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
        { name: "Members", href: "/admin/members", icon: Users },
        { name: "Member Applications", href: "/admin/applications", icon: UserCheck },
        { name: "Accounting Groups", href: "/admin/groups", icon: FolderTree },
        { name: "Monthly Contributions", href: "/admin/contributions", icon: Coins },
      ],
    },
    {
      title: "Assistance & Welfare",
      items: [
        { name: "Beneficiaries", href: "/admin/beneficiaries", icon: HandHeart },
        { name: "Qard Hasan (Loans)", href: "/admin/qard-hasan", icon: Scale },
        { name: "Sadakah Aid", href: "/admin/sadakah", icon: Heart },
      ],
    },
    {
      title: "Income & Outflow",
      items: [
        { name: "Expenses", href: "/admin/expenses", icon: Receipt },
        { name: "Donors & Donations", href: "/admin/donations", icon: Gift },
      ],
    },
    {
      title: "Accounting & Audit",
      items: [
        { name: "Group Ledgers", href: "/admin/ledgers", icon: BookOpen },
        { name: "Financial Reports", href: "/admin/reports", icon: FileBarChart2 },
        { name: "Audit Trail", href: "/admin/audit-logs", icon: History },
      ],
    },
    {
      title: "Administration",
      items: [
        { name: "Users & Roles", href: "/admin/users", icon: UserCog },
        { name: "Organization & CMS", href: "/admin/settings", icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex h-16 sm:h-20 items-center justify-between px-6 border-b border-slate-100 bg-slate-50/50">
          <Link href="/admin/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foundation-700 text-white shadow-sm">
              <Shield className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-900">Al-Birr Foundation</span>
              <span className="text-[10px] text-foundation-700 font-semibold tracking-wide uppercase">
                Management System
              </span>
            </div>
          </Link>
          <Link
            href="/"
            title="Public Website"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <Home className="h-4 w-4" />
          </Link>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <h5 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {section.title}
              </h5>
              <div className="mt-1 space-y-0.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                        isActive
                          ? "bg-foundation-50 text-foundation-900 font-semibold shadow-xs border-l-4 border-foundation-700"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`h-4 w-4 shrink-0 ${
                            isActive ? "text-foundation-700" : "text-slate-400"
                          }`}
                        />
                        <span>{item.name}</span>
                      </div>
                      {isActive && <ChevronRight className="h-3 w-3 text-foundation-600" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User profile / Logout bottom bar */}
        <div className="border-t border-slate-100 bg-slate-50/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 truncate">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foundation-200 text-xs font-bold text-foundation-800">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "A"}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-xs font-medium text-slate-800 truncate">
                  {user?.full_name || "Administrator"}
                </span>
                <span className="text-[10px] text-slate-500 truncate">
                  {user?.role?.name || (user?.is_superuser ? "Super Admin" : "Staff")}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
