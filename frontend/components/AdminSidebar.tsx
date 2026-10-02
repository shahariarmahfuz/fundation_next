"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FolderTree,
  Coins,
  HandHeart,
  Scale,
  Heart,
  Receipt,
  Gift,
  FileBarChart2,
  Building2,
  UserCog,
  Settings,
  ChevronDown,
  X
} from "lucide-react";
import { getStoredUser } from "@/lib/api";
import { useBranding } from "@/lib/branding";
import { FoundationLogo } from "./FoundationLogo";

interface SidebarProps {
  isOpen: boolean;
  isDesktopOpen?: boolean;
  onClose: () => void;
}

interface SubMenuItem {
  name: string;
  href: string;
  permission?: string;
}

interface NavSection {
  id: string;
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  children?: SubMenuItem[];
}

export const AdminSidebar: React.FC<SidebarProps> = ({ isOpen, isDesktopOpen = true, onClose }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { name } = useBranding();
  const [user, setUser] = useState<any | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  // Check user permission
  const hasAccess = (permission?: string): boolean => {
    if (!permission) return true;
    if (!user) return false;
    if (user.is_superuser || user.role?.name === "Super Admin") return true;
    const userPerms: string[] = user.role?.permissions?.map((p: any) => p.code) || [];
    return userPerms.includes(permission);
  };

  const navItems: NavSection[] = [
    {
      id: "dashboard",
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
      permission: "dashboard.view",
    },
    {
      id: "members",
      name: "Members",
      href: "/admin/members",
      icon: Users,
      permission: "members.view",
      children: [
        { name: "Add Member", href: "/admin/members/new", permission: "members.create" },
        { name: "Manage Members", href: "/admin/members", permission: "members.view" },
        { name: "Member Applications", href: "/admin/applications" },
        { name: "Member Ledger", href: "/admin/reports?tab=members" },
      ],
    },
    {
      id: "groups",
      name: "Groups",
      href: "/admin/groups",
      icon: FolderTree,
      permission: "groups.view",
      children: [
        { name: "Add Group", href: "/admin/groups/new", permission: "groups.create" },
        { name: "Manage Groups", href: "/admin/groups", permission: "groups.view" },
        { name: "Group Ledgers", href: "/admin/ledgers" },
      ],
    },
    {
      id: "contributions",
      name: "Contributions",
      href: "/admin/contributions",
      icon: Coins,
      permission: "contributions.view",
      children: [
        { name: "Receive Contribution", href: "/admin/contributions/receive", permission: "contributions.create" },
        { name: "Manage Contributions", href: "/admin/contributions", permission: "contributions.view" },
        { name: "Contribution Ledger", href: "/admin/contributions/ledger", permission: "contributions.view" },
      ],
    },
    {
      id: "beneficiaries",
      name: "Beneficiaries",
      href: "/admin/beneficiaries",
      icon: HandHeart,
      permission: "beneficiaries.view",
      children: [
        { name: "Add Beneficiary", href: "/admin/beneficiaries/new", permission: "beneficiaries.create" },
        { name: "Manage Beneficiaries", href: "/admin/beneficiaries", permission: "beneficiaries.view" },
        { name: "Beneficiary Ledger", href: "/admin/beneficiaries/ledger", permission: "beneficiaries.view" },
      ],
    },
    {
      id: "qard-hasan",
      name: "Qard Hasan",
      href: "/admin/qard-hasan",
      icon: Scale,
      permission: "qard_hasan.view",
      children: [
        { name: "New Qard Hasan", href: "/admin/qard-hasan/new", permission: "qard_hasan.create" },
        { name: "Manage Qard Hasan", href: "/admin/qard-hasan", permission: "qard_hasan.view" },
        { name: "Qard Hasan Ledger", href: "/admin/qard-hasan/ledger", permission: "qard_hasan.view" },
      ],
    },
    {
      id: "sadaqah",
      name: "Sadaqah",
      href: "/admin/sadaqah",
      icon: Heart,
      permission: "sadakah.view",
      children: [
        { name: "New Sadaqah", href: "/admin/sadaqah/new", permission: "sadakah.create" },
        { name: "Manage Sadaqah", href: "/admin/sadaqah", permission: "sadakah.view" },
        { name: "Sadaqah Ledger", href: "/admin/sadaqah/ledger", permission: "sadakah.view" },
      ],
    },
    {
      id: "expenses",
      name: "Expenses",
      href: "/admin/expenses",
      icon: Receipt,
      permission: "expenses.view",
      children: [
        { name: "Add Expense", href: "/admin/expenses/new", permission: "expenses.create" },
        { name: "Manage Expenses", href: "/admin/expenses", permission: "expenses.view" },
        { name: "Expense Ledger", href: "/admin/expenses/ledger", permission: "expenses.view" },
      ],
    },
    {
      id: "donations",
      name: "Donations",
      href: "/admin/donations",
      icon: Gift,
      permission: "donations.view",
      children: [
        { name: "All Donations", href: "/admin/donations" },
        { name: "Add Donation", href: "/admin/donations?action=new", permission: "donations.create" },
        { name: "Donors", href: "/admin/donations?tab=donors", permission: "donors.view" },
      ],
    },
    {
      id: "reports",
      name: "Reports",
      href: "/admin/reports",
      icon: FileBarChart2,
      permission: "reports.view",
      children: [
        { name: "Financial Reports", href: "/admin/reports?tab=financial" },
        { name: "Group Reports", href: "/admin/reports?tab=groups" },
        { name: "Member Reports", href: "/admin/reports?tab=members" },
        { name: "Contribution Reports", href: "/admin/reports?tab=contributions" },
        { name: "Expense Reports", href: "/admin/reports?tab=expenses" },
        { name: "Donation Reports", href: "/admin/reports?tab=donations" },
        { name: "Qard Hasan Reports", href: "/admin/reports?tab=qard" },
        { name: "Sadakah Reports", href: "/admin/reports?tab=sadakah" },
      ],
    },
    {
      id: "organization",
      name: "Organization",
      href: "/admin/settings",
      icon: Building2,
      permission: "settings.manage",
      children: [
        { name: "Foundation Information", href: "/admin/settings?tab=org" },
        { name: "Public Pages", href: "/admin/settings?tab=cms" },
        { name: "Goals", href: "/admin/settings?tab=cms&page=goals" },
        { name: "Mission", href: "/admin/settings?tab=cms&page=mission" },
        { name: "Activities", href: "/admin/settings?tab=cms&page=activities" },
        { name: "Contact Information", href: "/admin/settings?tab=cms&page=contact" },
      ],
    },
    {
      id: "users-access",
      name: "Users & Access",
      href: "/admin/users",
      icon: UserCog,
      permission: "users.manage",
      children: [
        { name: "Users", href: "/admin/users?tab=users" },
        { name: "Roles", href: "/admin/users?tab=roles" },
        { name: "Permissions", href: "/admin/users?tab=roles" },
      ],
    },
    {
      id: "settings",
      name: "Settings",
      href: "/admin/settings",
      icon: Settings,
      permission: "settings.manage",
      children: [
        { name: "Monthly Contribution", href: "/admin/settings?tab=contribution" },
        { name: "Foundation Profile", href: "/admin/settings?tab=org" },
        { name: "Public Website CMS", href: "/admin/settings?tab=cms" },
      ],
    },
  ];

  // Auto-expand section that contains active route
  useEffect(() => {
    if (!pathname) return;
    const currentQuery = searchParams ? searchParams.toString() : "";
    const activeSection = navItems.find((item) => {
      if (item.href === pathname) return true;
      if (item.children) {
        return item.children.some((child) => {
          const [childPath, childQuery] = child.href.split("?");
          if (childPath === pathname) {
            if (!childQuery) return true;
            return currentQuery.includes(childQuery);
          }
          return false;
        });
      }
      return false;
    });

    if (activeSection?.children) {
      setExpandedSections((prev) => ({
        ...prev,
        [activeSection.id]: true,
      }));
    }
  }, [pathname, searchParams]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  // Determine if a specific child link is active
  const isChildActive = (href: string) => {
    const [targetPath, targetQuery] = href.split("?");
    if (pathname !== targetPath) return false;
    if (!targetQuery) {
      return !searchParams.toString() || searchParams.toString() === "";
    }
    const currentQuery = searchParams.toString();
    return currentQuery.includes(targetQuery);
  };

  // Determine if top-level nav item is active
  const isParentActive = (item: NavSection) => {
    if (item.href === pathname && !item.children) return true;
    if (pathname.startsWith(item.href) && item.href !== "/admin/settings") return true;
    if (item.children) {
      return item.children.some((child) => isChildActive(child.href));
    }
    return false;
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/75 backdrop-blur-xs transition-opacity lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition-all duration-300 ease-in-out lg:static ${
          isOpen ? "translate-x-0 shadow-2xl w-72" : "-translate-x-full w-72"
        } ${
          isDesktopOpen
            ? "lg:translate-x-0 lg:w-72 lg:opacity-100"
            : "lg:-translate-x-full lg:w-0 lg:border-r-0 lg:overflow-hidden lg:opacity-0"
        }`}
      >
        {/* Sidebar Header with Foundation Logo and Foundation Name */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
          <Link href="/admin/dashboard" onClick={onClose} className="flex items-center gap-2.5 min-w-0 group">
            <FoundationLogo size="sm" />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate">
                {name || "Al-Birr Foundation"}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider truncate">
                Management Panel
              </span>
            </div>
          </Link>
          <button
            onClick={onClose}
            type="button"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white transition-colors lg:hidden shrink-0"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Section Label */}
        <div className="px-5 pt-4 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-900 hidden lg:block">
          Accounting & Operations
        </div>

        {/* Scrollable Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1 text-xs select-none">
          {navItems.map((item) => {
            if (!hasAccess(item.permission)) return null;

            const Icon = item.icon;
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = !!expandedSections[item.id];
            const active = isParentActive(item);

            if (!hasChildren) {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium transition-all ${
                    active
                      ? "bg-emerald-50 text-emerald-800 font-semibold border-l-2 border-emerald-600 shadow-sm dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${active ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`} />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            }

            return (
              <div key={item.id} className="space-y-0.5">
                {/* Parent Row Toggle */}
                <button
                  type="button"
                  onClick={() => toggleSection(item.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 font-medium transition-all ${
                    active
                      ? "bg-slate-100 text-slate-900 font-semibold dark:bg-slate-900/80 dark:text-white"
                      : "text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900/60 dark:hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`h-4 w-4 shrink-0 ${active ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`} />
                    <span className="truncate">{item.name}</span>
                  </div>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
                      isExpanded ? "rotate-180 text-emerald-600 dark:text-emerald-400" : ""
                    }`}
                  />
                </button>

                {/* Submenu Accordion */}
                {isExpanded && (
                  <div className="ml-5 pl-2 border-l border-slate-200 dark:border-slate-800/80 space-y-0.5 py-1">
                    {item.children?.map((child) => {
                      if (!hasAccess(child.permission)) return null;
                      const childActive = isChildActive(child.href);

                      return (
                        <Link
                          key={child.name + child.href}
                          href={child.href}
                          onClick={onClose}
                          className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-all ${
                            childActive
                              ? "bg-emerald-50 text-emerald-700 font-semibold dark:bg-emerald-500/20 dark:text-emerald-300"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                              childActive ? "bg-emerald-600 dark:bg-emerald-400" : "bg-slate-300 dark:bg-slate-600"
                            }`}
                          />
                          <span className="truncate">{child.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer Info inside Sidebar */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950/60 text-center">
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            Al-Birr Foundation • BDT (৳)
          </div>
          <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">
            Strict Double-Entry Fund Isolation
          </div>
        </div>
      </aside>
    </>
  );
};
