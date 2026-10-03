"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api, getStoredUser } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import { Pagination } from "@/components/Pagination";
import { CustomSelect } from "@/components/ui/custom-select";
import { Modal } from "@/components/Modal";
import {
  Users,
  Search,
  Plus,
  Filter,
  Eye,
  Edit,
  Trash2,
  Loader2,
  FolderTree,
  AlertCircle,
  CheckCircle2,
  ShieldAlert
} from "lucide-react";

export default function ManageMembersPage() {
  const [user, setUser] = useState<any | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "warning"; message: string } | null>(null);

  // Delete / Archive Confirmation Modal
  const [deletingMember, setDeletingMember] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const canCreate =
    user?.is_superuser ||
    user?.role?.name === "Super Admin" ||
    user?.role?.permissions?.some((p: any) => p.code === "members.create");

  const canEdit =
    user?.is_superuser ||
    user?.role?.name === "Super Admin" ||
    user?.role?.permissions?.some((p: any) => p.code === "members.update");

  const canDelete =
    user?.is_superuser ||
    user?.role?.name === "Super Admin" ||
    user?.role?.permissions?.some((p: any) => p.code === "members.delete");

  const fetchGroups = async () => {
    try {
      const data = await api.get("/groups");
      setGroups(data);
    } catch {}
  };

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });
      if (search) params.append("search", search);
      if (selectedGroup) params.append("group_id", selectedGroup);
      if (selectedStatus) params.append("status", selectedStatus);

      const res = await api.get(`/members?${params.toString()}`);
      setMembers(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err: any) {
      setError(err.message || "Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [page, pageSize, selectedGroup, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchMembers();
  };

  const handleConfirmDelete = async () => {
    if (!deletingMember) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/members/${deletingMember.id}`);
      setDeletingMember(null);
      setNotification({
        type: res.archived ? "warning" : "success",
        message: res.message || "Member operation completed.",
      });
      setTimeout(() => setNotification(null), 6000);
      fetchMembers();
    } catch (err: any) {
      setError(err.message || "Failed to process member deletion");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Manage Members
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            View, search, update status, and manage foundation member accounts and ledgers
          </p>
        </div>
        {canCreate && (
          <Link href="/admin/members/new" className="btn-primary shrink-0">
            <Plus className="h-4 w-4" />
            Add Member
          </Link>
        )}
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`flex items-center gap-3 rounded-xl border p-4 text-xs sm:text-sm ${
            notification.type === "warning"
              ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300"
              : "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
          }`}
        >
          {notification.type === "warning" ? (
            <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          ) : (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters & Search */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, member number, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9"
            />
          </div>

          <div className="w-48">
            <CustomSelect
              value={selectedGroup}
              onChange={(val) => {
                setSelectedGroup(String(val));
                setPage(1);
              }}
              options={[
                { value: "", label: "All Accounting Groups" },
                ...groups.map((g) => ({
                  value: String(g.id),
                  label: g.name,
                  sublabel: g.code,
                })),
              ]}
              searchable={true}
              searchPlaceholder="Search groups..."
            />
          </div>

          <div className="flex gap-2">
            <div className="w-40">
              <CustomSelect
                value={selectedStatus}
                onChange={(val) => {
                  setSelectedStatus(String(val));
                  setPage(1);
                }}
                options={[
                  { value: "", label: "All Statuses" },
                  { value: "ACTIVE", label: "ACTIVE" },
                  { value: "INACTIVE", label: "INACTIVE" },
                  { value: "SUSPENDED", label: "SUSPENDED" },
                ]}
                searchable={false}
              />
            </div>
            <button type="submit" className="btn-secondary">
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Members Table */}
      <div className="table-container">
        <table className="table-custom">
          <thead>
            <tr>
              <th>Member No.</th>
              <th>Full Name</th>
              <th>Phone</th>
              <th>Accounting Group</th>
              <th className="text-right">Monthly Due</th>
              <th className="text-right">Total Contributed</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-600" />
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-400 dark:text-slate-500">
                  No members found matching your search.
                </td>
              </tr>
            ) : (
              members.map((m) => (
                <tr key={m.id}>
                  <td className="font-mono text-xs font-semibold text-slate-900 dark:text-white">
                    {m.member_number}
                  </td>
                  <td className="font-semibold text-slate-900 dark:text-slate-100">{m.full_name}</td>
                  <td className="text-xs text-slate-600 dark:text-slate-300">{m.phone}</td>
                  <td>
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs font-medium text-slate-800 dark:text-slate-200">
                      <FolderTree className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                      {m.group?.name || `Group #${m.group_id}`}
                    </span>
                  </td>
                  <td className="text-right font-medium text-xs text-slate-900 dark:text-slate-200">
                    {formatCurrency(m.monthly_contribution_amount)}/mo
                  </td>
                  <td className="text-right font-semibold text-xs text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(m.total_contributions_paid)}
                  </td>
                  <td>
                    <StatusBadge status={m.status} />
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/admin/members/${m.id}`}
                        className="inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors"
                        title="View Profile and Ledger"
                      >
                        <Eye className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="hidden xl:inline">Ledger</span>
                      </Link>

                      {canEdit && (
                        <Link
                          href={`/admin/members/${m.id}/edit`}
                          className="inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors"
                          title="Edit Member"
                        >
                          <Edit className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                          <span className="hidden xl:inline">Edit</span>
                        </Link>
                      )}

                      {canDelete && (
                        <button
                          onClick={() => setDeletingMember(m)}
                          className="inline-flex items-center gap-1 rounded bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 px-2 py-1 text-xs font-medium text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                          title="Delete or Archive Member"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
        onPageChange={(p) => setPage(p)}
        onPageSizeChange={(ps) => {
          setPageSize(ps);
          setPage(1);
        }}
      />

      {/* Delete / Archive Confirmation Modal */}
      {deletingMember && (
        <Modal
          isOpen={!!deletingMember}
          onClose={() => setDeletingMember(null)}
          title="Confirm Member Deletion / Archival"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30 p-3 text-xs text-amber-800 dark:text-amber-300">
              <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Financial Integrity Protection Policy:</p>
                <p>
                  If <strong>{deletingMember.full_name}</strong> has existing contribution or payment records, they will be <strong>safely archived and marked INACTIVE</strong> rather than hard deleted, preserving full financial ledger auditability.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to proceed with deleting or archiving member{" "}
              <strong>{deletingMember.member_number} ({deletingMember.full_name})</strong>?
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingMember(null)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="rounded-lg bg-rose-600 hover:bg-rose-700 px-3 py-2 text-xs font-semibold text-white transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirm Delete / Archive
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
