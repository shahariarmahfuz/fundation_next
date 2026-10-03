"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  KeyRound,
  Shield,
  Search,
  Layers,
  ArrowLeft,
  Loader2,
  AlertCircle,
  ExternalLink,
  Plus,
  CheckCircle2,
  Info
} from "lucide-react";

interface PermissionItem {
  id: number;
  code: string;
  name: string;
  module: string;
  description: string | null;
}

interface RoleItem {
  id: number;
  name: string;
  permissions: Array<{ id: number; code: string }>;
}

export default function PermissionsDirectoryPage() {
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>("ALL");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [permsData, rolesData] = await Promise.all([
          api.get<PermissionItem[]>("/roles/permissions"),
          api.get<RoleItem[]>("/roles"),
        ]);
        setPermissions(permsData);
        setRoles(rolesData);
      } catch (err: any) {
        setError(err.message || "Failed to load permissions directory");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Map each permission ID to role names that have it
  const permToRolesMap = useMemo(() => {
    const map = new Map<number, string[]>();
    for (const r of roles) {
      for (const p of r.permissions || []) {
        if (!map.has(p.id)) {
          map.set(p.id, []);
        }
        map.get(p.id)!.push(r.name);
      }
    }
    return map;
  }, [roles]);

  // All unique modules
  const allModules = useMemo(() => {
    const set = new Set<string>();
    permissions.forEach((p) => set.add(p.module || "General"));
    return Array.from(set).sort();
  }, [permissions]);

  // Filter permissions
  const filteredPermissions = useMemo(() => {
    return permissions.filter((p) => {
      const mod = p.module || "General";
      if (selectedModuleFilter !== "ALL" && mod !== selectedModuleFilter) {
        return false;
      }
      if (!searchFilter.trim()) return true;
      const q = searchFilter.toLowerCase().trim();
      return (
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        mod.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    });
  }, [permissions, selectedModuleFilter, searchFilter]);

  // Group by module
  const groupedPermissions = useMemo(() => {
    const map: Record<string, PermissionItem[]> = {};
    for (const p of filteredPermissions) {
      const mod = p.module || "General";
      if (!map[mod]) map[mod] = [];
      map[mod].push(p);
    }
    return map;
  }, [filteredPermissions]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            <Link href="/admin/users" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              Users & Access
            </Link>
            <span>/</span>
            <Link href="/admin/roles" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              Roles
            </Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-white font-semibold">Permissions Directory</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Permissions Directory
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Comprehensive catalog of granular security privileges and capabilities across foundation modules
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/roles"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-colors"
          >
            <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Manage Roles</span>
          </Link>

          <Link
            href="/admin/roles/create"
            className="btn-primary inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Role</span>
          </Link>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
            <KeyRound className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{permissions.length}</div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Granular Privileges</div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{allModules.length}</div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Protected Feature Modules</div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{roles.length}</div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Access Roles Configured</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by permission name, code, or description..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Showing {filteredPermissions.length} of {permissions.length} permissions
          </div>
        </div>

        {/* Module Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setSelectedModuleFilter("ALL")}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
              selectedModuleFilter === "ALL"
                ? "bg-slate-900 text-white dark:bg-emerald-600 dark:text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            All Modules ({permissions.length})
          </button>
          {allModules.map((mod) => {
            const count = permissions.filter((p) => (p.module || "General") === mod).length;
            const isSelected = selectedModuleFilter === mod;
            return (
              <button
                key={mod}
                type="button"
                onClick={() => setSelectedModuleFilter(mod)}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-slate-900 text-white dark:bg-emerald-600 dark:text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                {mod} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Permissions Content */}
      {loading ? (
        <div className="py-24 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600 dark:text-emerald-400" />
          <span className="mt-3 block text-sm font-medium text-slate-500 dark:text-slate-400">
            Loading permissions directory...
          </span>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 p-8 text-center text-rose-800 dark:text-rose-300">
          <AlertCircle className="mx-auto h-8 w-8 mb-2 text-rose-600 dark:text-rose-400" />
          <div className="font-bold">{error}</div>
        </div>
      ) : Object.keys(groupedPermissions).length === 0 ? (
        <div className="py-16 text-center text-slate-500 dark:text-slate-400">
          <KeyRound className="mx-auto h-8 w-8 text-slate-400 mb-2" />
          <div className="font-semibold">No permissions match the filter.</div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedPermissions).map(([moduleName, perms]) => (
            <div
              key={moduleName}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
            >
              {/* Module Header */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      {moduleName}
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Module permissions and operation scopes
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {perms.length} {perms.length === 1 ? "Permission" : "Permissions"}
                </span>
              </div>

              {/* Permissions Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-50/30 dark:bg-slate-950/30 uppercase tracking-wider text-[11px] text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Permission Name</th>
                      <th className="px-6 py-3 font-semibold">System Code</th>
                      <th className="px-6 py-3 font-semibold">Description</th>
                      <th className="px-6 py-3 font-semibold">Assigned Roles</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {perms.map((p) => {
                      const assignedRoles = permToRolesMap.get(p.id) || [];

                      return (
                        <tr
                          key={p.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-white">
                            {p.name}
                          </td>
                          <td className="px-6 py-3.5">
                            <span className="inline-block font-mono text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                              {p.code}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-slate-500 dark:text-slate-400 max-w-md">
                            {p.description || "—"}
                          </td>
                          <td className="px-6 py-3.5">
                            <div className="flex flex-wrap items-center gap-1.5 max-w-xs">
                              {assignedRoles.length > 0 ? (
                                assignedRoles.map((roleName) => (
                                  <span
                                    key={roleName}
                                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                                      roleName === "Super Admin"
                                        ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                                    }`}
                                  >
                                    {roleName}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">None</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
