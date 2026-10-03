"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import {
  Shield,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  Circle,
  Search,
  CheckCheck,
  XCircle,
  Save,
  Loader2,
  AlertCircle,
  Layers,
  ShieldCheck,
  Info
} from "lucide-react";

interface PermissionItem {
  id: number;
  code: string;
  name: string;
  module: string;
  description: string | null;
}

interface RoleDetail {
  id: number;
  name: string;
  description: string | null;
  is_system: boolean;
  users_count?: number;
  permissions: PermissionItem[];
}

export default function EditRolePage() {
  const router = useRouter();
  const params = useParams();
  const roleId = params?.id as string;

  // Form State
  const [role, setRole] = useState<RoleDetail | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);

  // Permissions Data
  const [allPermissions, setAllPermissions] = useState<PermissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!roleId) return;

    async function loadData() {
      setLoading(true);
      setErrorMessage(null);
      try {
        const [roleData, permsData] = await Promise.all([
          api.get<RoleDetail>(`/roles/${roleId}`),
          api.get<PermissionItem[]>("/roles/permissions"),
        ]);

        setRole(roleData);
        setName(roleData.name);
        setDescription(roleData.description || "");
        setSelectedPermissionIds(roleData.permissions?.map((p) => p.id) || []);
        setAllPermissions(permsData);
      } catch (err: any) {
        setErrorMessage(err.message || "Failed to load role details");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [roleId]);

  // Filter permissions based on search query
  const filteredPermissions = useMemo(() => {
    if (!searchFilter.trim()) return allPermissions;
    const q = searchFilter.toLowerCase().trim();
    return allPermissions.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.module.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }, [allPermissions, searchFilter]);

  // Group filtered permissions by module
  const groupedPermissions = useMemo(() => {
    const map: Record<string, PermissionItem[]> = {};
    for (const p of filteredPermissions) {
      const mod = p.module || "General";
      if (!map[mod]) map[mod] = [];
      map[mod].push(p);
    }
    return map;
  }, [filteredPermissions]);

  const totalPermissionsCount = allPermissions.length;
  const selectedCount = selectedPermissionIds.length;
  const isSuperAdmin = role?.name === "Super Admin";

  // Toggle single permission
  const togglePermission = (id: number) => {
    if (isSuperAdmin) return; // Super admin permissions cannot be toggled
    setSelectedPermissionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Global Select All
  const handleSelectAllGlobal = () => {
    if (isSuperAdmin) return;
    const idsToSelect = filteredPermissions.map((p) => p.id);
    setSelectedPermissionIds((prev) => {
      const set = new Set([...prev, ...idsToSelect]);
      return Array.from(set);
    });
  };

  // Global Clear All
  const handleClearAllGlobal = () => {
    if (isSuperAdmin) return;
    const idsToClear = new Set(filteredPermissions.map((p) => p.id));
    setSelectedPermissionIds((prev) => prev.filter((id) => !idsToClear.has(id)));
  };

  // Module Select All
  const handleSelectModule = (modulePerms: PermissionItem[]) => {
    if (isSuperAdmin) return;
    const ids = modulePerms.map((p) => p.id);
    setSelectedPermissionIds((prev) => {
      const set = new Set([...prev, ...ids]);
      return Array.from(set);
    });
  };

  // Module Clear All
  const handleClearModule = (modulePerms: PermissionItem[]) => {
    if (isSuperAdmin) return;
    const idsToClear = new Set(modulePerms.map((p) => p.id));
    setSelectedPermissionIds((prev) => prev.filter((id) => !idsToClear.has(id)));
  };

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage("Please enter a valid role name.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      await api.put(`/roles/${roleId}`, {
        name: isSuperAdmin ? "Super Admin" : name.trim(),
        description: description.trim() || null,
        permission_ids: isSuperAdmin ? undefined : selectedPermissionIds,
      });

      router.push("/admin/roles");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update role");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600 dark:text-emerald-400" />
        <span className="mt-3 block text-sm font-medium text-slate-500 dark:text-slate-400">
          Loading role configuration...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
            <span className="text-slate-900 dark:text-white font-semibold">Edit</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <span>Edit Role — {role?.name}</span>
            {role?.is_system && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>System Role</span>
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Modify role attributes and fine-tune assigned module permissions
          </p>
        </div>

        <Link
          href="/admin/roles"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-colors self-start sm:self-auto"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Roles</span>
        </Link>
      </div>

      {/* Super Admin Notice */}
      {isSuperAdmin && (
        <div className="flex items-center gap-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-4 text-xs font-medium text-amber-800 dark:text-amber-300">
          <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <div>
            <span className="font-bold">System Protected Role:</span> The Super Admin role possesses permanent access to all foundation operations and cannot be renamed or stripped of permissions.
          </div>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="flex items-center gap-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-4 text-sm font-medium text-rose-800 dark:text-rose-300">
          <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Role Information Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Role Information</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Update the role title, scope description, and usage notes
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Role Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSuperAdmin}
                required
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Description
              </label>
              <input
                type="text"
                placeholder="Briefly describe the responsibilities..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Granular Permission Matrix Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          {/* Permissions Header & Sticky Toolbar */}
          <div className="border-b border-slate-200 dark:border-slate-800 p-6 bg-slate-50/50 dark:bg-slate-950/50">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Permissions Matrix
                  </h2>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Configure granular operations permitted for users assigned to this role
                </p>
              </div>

              {/* Real-time Permission Counter Badge */}
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 px-4 py-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 shadow-xs">
                  <span>Selected:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 text-sm font-extrabold">
                    {selectedCount}
                  </span>
                  <span className="text-emerald-700/60 dark:text-emerald-400/60">/</span>
                  <span>{totalPermissionsCount} permissions</span>
                </div>
              </div>
            </div>

            {/* Quick Filters Toolbar */}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Search Permissions */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search permissions by name, module, or code..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>

              {/* Global Select All / Clear All */}
              {!isSuperAdmin && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllGlobal}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs"
                  >
                    <CheckCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Select All</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAllGlobal}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs"
                  >
                    <XCircle className="h-3.5 w-3.5 text-slate-400" />
                    <span>Clear All</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Module-Grouped Permission List */}
          <div className="p-6 space-y-6">
            {Object.keys(groupedPermissions).length === 0 ? (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm">
                No permissions matched "{searchFilter}".
              </div>
            ) : (
              Object.entries(groupedPermissions).map(([moduleName, perms]) => {
                const moduleSelectedCount = perms.filter((p) =>
                  selectedPermissionIds.includes(p.id)
                ).length;

                return (
                  <div
                    key={moduleName}
                    className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-950/30 p-5 space-y-4 transition-colors"
                  >
                    {/* Module Header Bar */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                          <Layers className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            {moduleName}
                          </h3>
                        </div>
                        <span className="ml-2 inline-flex items-center rounded-full bg-slate-200/70 dark:bg-slate-800 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          {moduleSelectedCount} / {perms.length} selected
                        </span>
                      </div>

                      {/* Module Controls */}
                      {!isSuperAdmin && (
                        <div className="flex items-center gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => handleSelectModule(perms)}
                            className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                          >
                            Select All
                          </button>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <button
                            type="button"
                            onClick={() => handleClearModule(perms)}
                            className="font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Permissions Grid */}
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {perms.map((perm) => {
                        const isSelected = selectedPermissionIds.includes(perm.id);

                        return (
                          <div
                            key={perm.id}
                            onClick={() => togglePermission(perm.id)}
                            className={`cursor-pointer rounded-xl border p-3.5 transition-all flex items-start gap-3 select-none ${
                              isSelected
                                ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs"
                                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
                            } ${isSuperAdmin ? "cursor-default opacity-85" : ""}`}
                          >
                            <div className="mt-0.5 flex-shrink-0">
                              {isSelected ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Circle className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                                {perm.name}
                              </div>
                              <div className="mt-0.5 font-mono text-[10px] text-slate-400 dark:text-slate-500 truncate">
                                {perm.code}
                              </div>
                              {perm.description && (
                                <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                                  {perm.description}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Link
            href="/admin/roles"
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition-all disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Role Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
