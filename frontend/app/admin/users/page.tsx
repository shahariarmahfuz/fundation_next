"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import { Modal } from "@/components/Modal";
import { CustomSelect } from "@/components/ui/custom-select";
import {
  Shield,
  Plus,
  Edit,
  CheckCircle,
  Loader2,
  Users,
  ShieldCheck,
  Search,
  KeyRound,
  ExternalLink,
  AlertCircle
} from "lucide-react";

interface RoleOption {
  id: number;
  name: string;
  is_system: boolean;
}

interface UserItem {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role_id: number | null;
  role: RoleOption | null;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // User Modal State
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
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

  const [notification, setNotification] = useState<string | null>(null);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const [userData, rolesData] = await Promise.all([
        api.get<UserItem[]>("/users"),
        api.get<RoleOption[]>("/roles"),
      ]);
      setUsers(userData);
      setRoles(rolesData);
    } catch (err: any) {
      setError(err.message || "Failed to load personnel accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenUserModal = (user: UserItem | null = null) => {
    setEditingUser(user);
    setUserModalError(null);
    if (user) {
      setUserFormData({
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        password: "",
        role_id: user.role_id ? String(user.role_id) : "",
        is_active: user.is_active,
      });
    } else {
      setUserFormData({
        username: "",
        email: "",
        full_name: "",
        password: "",
        role_id: "",
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
        const payload: any = {
          full_name: userFormData.full_name,
          email: userFormData.email,
          role_id: userFormData.role_id ? Number(userFormData.role_id) : null,
          is_active: userFormData.is_active,
        };
        if (userFormData.password) {
          payload.password = userFormData.password;
        }
        await api.put(`/users/${editingUser.id}`, payload);
        notify(`User ${editingUser.username} updated successfully.`);
      } else {
        if (!userFormData.password) {
          throw new Error("Password is required for new accounts");
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

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.full_name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.role && u.role.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            <span>Users & Access</span>
            <span>/</span>
            <span className="text-slate-900 dark:text-white font-semibold">Users</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Staff & Personnel Accounts
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage staff credentials, activate accounts, and assign access roles
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/roles"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-colors"
          >
            <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Manage Roles</span>
          </Link>

          <button
            onClick={() => handleOpenUserModal(null)}
            className="btn-primary inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Add Staff User</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4 text-sm text-emerald-800 dark:text-emerald-300">
          <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Table Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        {/* Search Toolbar */}
        <div className="border-b border-slate-200 dark:border-slate-800 p-4 sm:flex sm:items-center sm:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search users by name, username, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="mt-3 sm:mt-0 text-xs font-medium text-slate-500 dark:text-slate-400">
            Showing {filteredUsers.length} of {users.length} accounts
          </div>
        </div>

        {/* Users Table */}
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
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-600 dark:text-emerald-400" />
                    <span className="mt-2 block text-xs text-slate-500 dark:text-slate-400">
                      Loading user accounts...
                    </span>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-6 py-6 text-center text-rose-600 dark:text-rose-400">
                    <AlertCircle className="mx-auto h-6 w-6 mb-1" />
                    <div>{error}</div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                    No accounts found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{u.full_name}</span>
                        {u.is_superuser && (
                          <span className="inline-flex items-center rounded-md bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            Superuser
                          </span>
                        )}
                      </div>
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
                        className="btn-secondary !py-1 !px-2.5 text-xs inline-flex items-center gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
              <CustomSelect
                value={userFormData.role_id}
                onChange={(val) => setUserFormData({ ...userFormData, role_id: String(val) })}
                options={[
                  { value: "", label: "No Role Assigned" },
                  ...roles.map((r) => ({
                    value: String(r.id),
                    label: r.name,
                  })),
                ]}
                searchable={false}
              />
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
    </div>
  );
}
