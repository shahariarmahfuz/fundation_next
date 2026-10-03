"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Users,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  CheckCircle,
  AlertCircle,
  Search,
  ExternalLink,
  Layers
} from "lucide-react";
import { Modal } from "@/components/Modal";

interface RoleItem {
  id: number;
  name: string;
  description: string | null;
  is_system: boolean;
  users_count?: number;
  permissions: Array<{
    id: number;
    code: string;
    name: string;
    module: string;
  }>;
}

export default function RolesListPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Deletion modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<RoleItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<RoleItem[]>("/roles");
      setRoles(data);
    } catch (err: any) {
      setError(err.message || "Failed to load roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const notify = (type: "success" | "error", text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleOpenDelete = (role: RoleItem) => {
    setRoleToDelete(role);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!roleToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/roles/${roleToDelete.id}`);
      notify("success", `Role "${roleToDelete.name}" was successfully removed.`);
      setDeleteModalOpen(false);
      setRoleToDelete(null);
      fetchRoles();
    } catch (err: any) {
      notify("error", err.message || "Failed to delete role");
    } finally {
      setDeleting(false);
    }
  };

  const filteredRoles = roles.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      (r.description && r.description.toLowerCase().includes(q))
    );
  });

  const totalRoles = roles.length;
  const systemRolesCount = roles.filter((r) => r.is_system).length;
  const customRolesCount = totalRoles - systemRolesCount;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            <Link href="/admin/users" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              Users & Access
            </Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-white font-semibold">Roles</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Role Management
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Define access profiles, manage administrative permissions, and configure role matrices
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/roles/permissions"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-colors"
          >
            <KeyRound className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Permissions Directory</span>
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

      {/* Alert Notification */}
      {notification && (
        <div
          className={`flex items-center gap-3 rounded-xl p-4 text-sm font-medium border ${
            notification.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
              : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalRoles}</div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Configured Roles</div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{systemRolesCount}</div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">System Protected Roles</div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{customRolesCount}</div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Custom Defined Roles</div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        {/* Search Toolbar */}
        <div className="border-b border-slate-200 dark:border-slate-800 p-4 sm:flex sm:items-center sm:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search roles by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="mt-3 sm:mt-0 text-xs font-medium text-slate-500 dark:text-slate-400">
            Showing {filteredRoles.length} of {roles.length} roles
          </div>
        </div>

        {/* Roles Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-950 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Description</th>
                <th className="px-6 py-4 font-semibold text-center">Assigned Users</th>
                <th className="px-6 py-4 font-semibold">Permissions</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Loader2 className="mx-auto h-7 w-7 animate-spin text-emerald-600 dark:text-emerald-400" />
                    <span className="mt-2 block text-sm font-medium text-slate-500 dark:text-slate-400">
                      Loading configured roles...
                    </span>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-rose-600 dark:text-rose-400">
                    <AlertCircle className="mx-auto h-8 w-8 mb-2" />
                    <div className="font-semibold">{error}</div>
                    <button
                      onClick={fetchRoles}
                      className="mt-3 inline-flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      Try refreshing
                    </button>
                  </td>
                </tr>
              ) : filteredRoles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    <ShieldAlert className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                    <div className="font-medium">No roles match your search filter.</div>
                  </td>
                </tr>
              ) : (
                filteredRoles.map((role) => {
                  const permCount = role.permissions?.length || 0;
                  const usersCount = role.users_count ?? 0;
                  const isProtected = role.is_system || role.name === "Super Admin";

                  return (
                    <tr
                      key={role.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Role Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-xl font-bold text-sm ${
                              role.name === "Super Admin"
                                ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                                : role.is_system
                                ? "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                                : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                            }`}
                          >
                            <Shield className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              <span>{role.name}</span>
                              {role.name === "Super Admin" && (
                                <span className="inline-flex items-center rounded-md bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                  Root Admin
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                              ID: #{role.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="px-6 py-4 max-w-xs">
                        <span className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                          {role.description || "No description provided"}
                        </span>
                      </td>

                      {/* Users Count */}
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                            usersCount > 0
                              ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                              : "bg-slate-50 dark:bg-slate-950 text-slate-400"
                          }`}
                        >
                          <Users className="h-3.5 w-3.5" />
                          <span>{usersCount} {usersCount === 1 ? "User" : "Users"}</span>
                        </span>
                      </td>

                      {/* Permissions Count */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <KeyRound className="h-3 w-3" />
                              <span>{permCount} Permissions</span>
                            </span>
                          </div>
                          {role.permissions && role.permissions.length > 0 && (
                            <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-xs">
                              {Array.from(new Set(role.permissions.map((p) => p.module))).slice(0, 3).join(", ")}
                              {new Set(role.permissions.map((p) => p.module)).size > 3 ? "..." : ""}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        {role.is_system ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/50 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            <span>System Role</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <Layers className="h-3.5 w-3.5" />
                            <span>Custom Role</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center justify-center gap-2">
                          <Link
                            href={`/admin/roles/${role.id}/edit`}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shadow-sm"
                            title="Edit Role & Permissions"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </Link>

                          {!isProtected && (
                            <button
                              onClick={() => handleOpenDelete(role)}
                              disabled={usersCount > 0}
                              className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors shadow-sm ${
                                usersCount > 0
                                  ? "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-400 cursor-not-allowed"
                                  : "border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60"
                              }`}
                              title={
                                usersCount > 0
                                  ? "Cannot delete role assigned to active users"
                                  : "Delete Role"
                              }
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Role Deletion"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-4 text-rose-800 dark:text-rose-300 text-sm">
            <AlertCircle className="h-6 w-6 flex-shrink-0 text-rose-600 dark:text-rose-400" />
            <div>
              <div className="font-bold">Permanent Action Warning</div>
              <div>
                Are you sure you want to delete the custom role{" "}
                <span className="font-semibold underline">"{roleToDelete?.name}"</span>?
                This action cannot be undone.
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            This role currently has {roleToDelete?.permissions?.length || 0} permissions configured.
            Make sure no personnel require these privileges before proceeding.
          </p>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setDeleteModalOpen(false)}
              className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-500 disabled:opacity-50"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Role</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
