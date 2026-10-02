"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import { Modal } from "@/components/Modal";
import {
  Shield,
  Plus,
  Edit,
  CheckCircle,
  Loader2,
  Users,
  ShieldCheck
} from "lucide-react";

export default function UsersRolesPage() {
  const [activeTab, setActiveTab] = useState<"users" | "roles">("users");

  // Users State
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);

  // Roles & Permissions State
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  // User Modal State
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [userFormData, setUserFormData] = useState({
    username: "",
    email: "",
    full_name: "",
    password: "",
    role_id: "",
    is_active: true,
  });
  const [userSubmitting, setUserSubmitting] = useState(false);
  const [userModalError, setUserModalError] = useState<string | null>(null);

  // Role Modal State
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any | null>(null);
  const [roleFormData, setRoleFormData] = useState({
    name: "",
    description: "",
    permission_ids: [] as number[],
  });
  const [roleSubmitting, setRoleSubmitting] = useState(false);
  const [roleModalError, setRoleModalError] = useState<string | null>(null);

  const [notification, setNotification] = useState<string | null>(null);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const data = await api.get("/users");
      setUsers(data);
    } catch (err: any) {
      setUsersError(err.message || "Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchRolesAndPermissions = async () => {
    setRolesLoading(true);
    try {
      const [rRes, pRes] = await Promise.all([
        api.get("/roles"),
        api.get("/roles/permissions"),
      ]);
      setRoles(rRes);
      setPermissions(pRes);
    } catch (err: any) {
      console.error(err);
    } finally {
      setRolesLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRolesAndPermissions();
  }, []);

  // Open User Modal
  const handleOpenUserModal = (user: any | null = null) => {
    setEditingUser(user);
    setUserModalError(null);
    if (user) {
      setUserFormData({
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        password: "",
        role_id: user.role_id ? user.role_id.toString() : "",
        is_active: user.is_active,
      });
    } else {
      setUserFormData({
        username: "",
        email: "",
        full_name: "",
        password: "",
        role_id: roles.length > 0 ? roles[0].id.toString() : "",
        is_active: true,
      });
    }
    setUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserSubmitting(true);
    setUserModalError(null);

    try {
      if (editingUser) {
        // Update user
        const updatePayload: any = {
          email: userFormData.email,
          full_name: userFormData.full_name,
          role_id: userFormData.role_id ? Number(userFormData.role_id) : null,
          is_active: userFormData.is_active,
        };
        if (userFormData.password) {
          updatePayload.password = userFormData.password;
        }
        await api.put(`/users/${editingUser.id}`, updatePayload);
        notify(`User ${editingUser.username} updated successfully.`);
      } else {
        // Create user
        if (!userFormData.password) {
          setUserModalError("Password is required for new users");
          setUserSubmitting(false);
          return;
        }
        await api.post("/users", {
          ...userFormData,
          role_id: userFormData.role_id ? Number(userFormData.role_id) : null,
        });
        notify(`User ${userFormData.username} created successfully.`);
      }
      setUserModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setUserModalError(err.message || "Failed to save user");
    } finally {
      setUserSubmitting(false);
    }
  };

  // Open Role Modal
  const handleOpenRoleModal = (role: any | null = null) => {
    setEditingRole(role);
    setRoleModalError(null);
    if (role) {
      setRoleFormData({
        name: role.name,
        description: role.description || "",
        permission_ids: role.permissions?.map((p: any) => p.id) || [],
      });
    } else {
      setRoleFormData({
        name: "",
        description: "",
        permission_ids: [],
      });
    }
    setRoleModalOpen(true);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setRoleSubmitting(true);
    setRoleModalError(null);

    try {
      if (editingRole) {
        await api.put(`/roles/${editingRole.id}`, roleFormData);
        notify(`Role ${editingRole.name} updated successfully.`);
      } else {
        await api.post("/roles", roleFormData);
        notify(`Role ${roleFormData.name} created successfully.`);
      }
      setRoleModalOpen(false);
      fetchRolesAndPermissions();
    } catch (err: any) {
      setRoleModalError(err.message || "Failed to save role");
    } finally {
      setRoleSubmitting(false);
    }
  };

  // Toggle permission in role form
  const togglePermission = (permId: number) => {
    setRoleFormData((prev) => {
      const exists = prev.permission_ids.includes(permId);
      return {
        ...prev,
        permission_ids: exists
          ? prev.permission_ids.filter((id) => id !== permId)
          : [...prev.permission_ids, permId],
      };
    });
  };

  // Group permissions by module
  const permissionsByModule = permissions.reduce((acc: Record<string, any[]>, perm: any) => {
    const mod = perm.module || "general";
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(perm);
    return acc;
  }, {});

  return (
    <div className="space-y-6 transition-colors">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Users, Roles & Access Control
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage personnel accounts, grant granular permissions, and configure access levels
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === "users" ? (
            <button
              onClick={() => handleOpenUserModal(null)}
              className="btn-primary"
            >
              <Plus className="h-4 w-4" />
              Add Staff User
            </button>
          ) : (
            <button
              onClick={() => handleOpenRoleModal(null)}
              className="btn-primary"
            >
              <Plus className="h-4 w-4" />
              Create Custom Role
            </button>
          )}
        </div>
      </div>

      {notification && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4 text-sm text-emerald-800 dark:text-emerald-300">
          <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("users")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "users"
              ? "bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-800"
          }`}
        >
          <Users className="h-4 w-4" />
          Personnel Accounts ({users.length})
        </button>

        <button
          onClick={() => setActiveTab("roles")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "roles"
              ? "bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-800"
          }`}
        >
          <Shield className="h-4 w-4" />
          Roles & Permissions ({roles.length})
        </button>
      </div>

      {/* TAB 1: USERS */}
      {activeTab === "users" && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3 font-semibold">User Details</th>
                  <th className="px-6 py-3 font-semibold">Email</th>
                  <th className="px-6 py-3 font-semibold">Assigned Role</th>
                  <th className="px-6 py-3 font-semibold text-center">Status</th>
                  <th className="px-6 py-3 font-semibold">Created Date</th>
                  <th className="px-6 py-3 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {usersLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-600 dark:text-emerald-400" />
                      <span className="mt-2 block text-xs text-slate-500 dark:text-slate-400">Loading user accounts...</span>
                    </td>
                  </tr>
                ) : usersError ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-6 text-center text-rose-600 dark:text-rose-400">
                      {usersError}
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-white">{u.full_name}</div>
                        <div className="font-mono text-xs text-slate-400">@{u.username}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          {u.role?.name || (u.is_superuser ? "Super Admin" : "No Role")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={u.is_active ? "ACTIVE" : "INACTIVE"} />
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                        {formatDate(u.created_at)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleOpenUserModal(u)}
                          className="btn-secondary !py-1 !px-2.5 text-xs"
                        >
                          <Edit className="h-3 w-3" />
                          Edit User
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ROLES & PERMISSIONS */}
      {activeTab === "roles" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {roles.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col justify-between transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{r.name}</h3>
                      {r.is_system && (
                        <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-2xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          System Role
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{r.description || "No description provided."}</p>
                  </div>

                  <button
                    onClick={() => handleOpenRoleModal(r)}
                    className="btn-secondary !py-1 !px-2.5 text-xs"
                  >
                    <Edit className="h-3 w-3" />
                    Configure
                  </button>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Granted Permissions ({r.permissions?.length || 0})
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                    {r.permissions?.length === 0 ? (
                      <span className="text-xs text-slate-400 dark:text-slate-500">No permissions assigned.</span>
                    ) : (
                      r.permissions?.map((p: any) => (
                        <span
                          key={p.id}
                          className="rounded-md bg-slate-50 dark:bg-slate-800 px-2 py-0.5 text-2xs font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        >
                          {p.code}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* USER MODAL */}
      <Modal
        isOpen={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        title={editingUser ? `Edit User — ${editingUser.username}` : "Create New Staff Account"}
      >
        <form onSubmit={handleSaveUser} className="space-y-4">
          {userModalError && (
            <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 p-3 text-xs text-rose-800 dark:text-rose-400">
              {userModalError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Username *
              </label>
              <input
                required
                type="text"
                disabled={!!editingUser}
                value={userFormData.username}
                onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Full Name *
              </label>
              <input
                required
                type="text"
                value={userFormData.full_name}
                onChange={(e) => setUserFormData({ ...userFormData, full_name: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Email Address *
              </label>
              <input
                required
                type="email"
                value={userFormData.email}
                onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Security Role *
              </label>
              <select
                value={userFormData.role_id}
                onChange={(e) => setUserFormData({ ...userFormData, role_id: e.target.value })}
                className="input-field"
              >
                <option value="">No Role Assigned</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              {editingUser ? "Change Password (Leave blank to keep current)" : "Password *"}
            </label>
            <input
              type="password"
              value={userFormData.password}
              onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
              placeholder={editingUser ? "••••••••" : "Minimum 8 characters"}
              className="input-field"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="is_active"
              checked={userFormData.is_active}
              onChange={(e) => setUserFormData({ ...userFormData, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Account is Active and authorized to log in
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setUserModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={userSubmitting}
              className="btn-primary"
            >
              {userSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingUser ? "Save Changes" : "Create Account"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ROLE MODAL */}
      <Modal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        title={editingRole ? `Configure Role — ${editingRole.name}` : "Create Custom Role"}
        maxWidth="xl"
      >
        <form onSubmit={handleSaveRole} className="space-y-4">
          {roleModalError && (
            <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 p-3 text-xs text-rose-800 dark:text-rose-400">
              {roleModalError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Role Name *
            </label>
            <input
              required
              type="text"
              value={roleFormData.name}
              onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={roleFormData.description}
              onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
              className="input-field"
            />
          </div>

          {/* Permissions Matrix */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Permissions Matrix ({roleFormData.permission_ids.length} selected)
            </label>
            <div className="space-y-3 max-h-64 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-950/50">
              {Object.entries(permissionsByModule).map(([mod, perms]) => (
                <div key={mod} className="border-b border-slate-200 dark:border-slate-800 pb-2 last:border-b-0">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    {mod} Module
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {perms.map((p) => {
                      const isChecked = roleFormData.permission_ids.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className={`flex items-start gap-2 p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                            isChecked
                              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-300"
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePermission(p.id)}
                            className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <div>
                            <span className="font-semibold block">{p.name}</span>
                            <span className="font-mono text-2xs text-slate-400 block">{p.code}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setRoleModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={roleSubmitting}
              className="btn-primary"
            >
              {roleSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingRole ? "Update Permissions" : "Create Role"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
