"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, getStoredUser } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import { Modal } from "@/components/Modal";
import {
  FolderTree,
  Plus,
  Coins,
  Scale,
  Users,
  Eye,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  ArrowRightLeft,
  CheckCircle2,
  Search,
  ShieldAlert,
  BookOpen
} from "lucide-react";

export default function ManageGroupsPage() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any | null>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [notification, setNotification] = useState<{ type: "success" | "warning"; message: string } | null>(null);

  // New Group Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    opening_balance: "0.00",
    status: "ACTIVE",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Edit Group Modal
  const [editingGroup, setEditingGroup] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState({
    code: "",
    name: "",
    description: "",
    status: "ACTIVE",
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Group Modal
  const [deletingGroup, setDeletingGroup] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Transfer Modal
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferData, setTransferData] = useState({
    source_group_id: "",
    destination_group_id: "",
    amount: "1000.00",
    notes: "",
  });
  const [transferring, setTransferring] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const canCreate =
    user?.is_superuser ||
    user?.role?.name === "Super Admin" ||
    user?.role?.permissions?.some((p: any) => p.code === "groups.create");

  const canEdit =
    user?.is_superuser ||
    user?.role?.name === "Super Admin" ||
    user?.role?.permissions?.some((p: any) => p.code === "groups.update");

  const canDelete =
    user?.is_superuser ||
    user?.role?.name === "Super Admin" ||
    user?.role?.permissions?.some((p: any) => p.code === "groups.delete");

  const fetchGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get("/groups");
      if (Array.isArray(data)) {
        setGroups(data);
      } else if (data && Array.isArray(data.items)) {
        setGroups(data.items);
      } else {
        setGroups([]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // Check if ?action=new is in query string
  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.post("/groups", {
        ...formData,
        code: formData.code.trim() || undefined,
        opening_balance: parseFloat(formData.opening_balance) || 0,
      });
      setIsModalOpen(false);
      setFormData({
        code: "",
        name: "",
        description: "",
        opening_balance: "0.00",
        status: "ACTIVE",
      });
      setNotification({
        type: "success",
        message: `Accounting Group ${formData.name} created successfully!`,
      });
      setTimeout(() => setNotification(null), 5000);
      fetchGroups();
    } catch (err: any) {
      setSubmitError(err.message || "Failed to create group");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (g: any) => {
    setEditingGroup(g);
    setEditFormData({
      code: g.code || "",
      name: g.name || "",
      description: g.description || "",
      status: g.status || "ACTIVE",
    });
    setEditError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup) return;
    setSavingEdit(true);
    setEditError(null);
    try {
      await api.put(`/groups/${editingGroup.id}`, {
        ...editFormData,
        code: editFormData.code.trim() || undefined,
      });
      setEditingGroup(null);
      setNotification({
        type: "success",
        message: `Group ${editFormData.name} updated successfully!`,
      });
      setTimeout(() => setNotification(null), 5000);
      fetchGroups();
    } catch (err: any) {
      setEditError(err.message || "Failed to update group");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingGroup) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/groups/${deletingGroup.id}`);
      setDeletingGroup(null);
      setNotification({
        type: res.archived ? "warning" : "success",
        message: res.message || "Group operation completed.",
      });
      setTimeout(() => setNotification(null), 6000);
      fetchGroups();
    } catch (err: any) {
      setError(err.message || "Failed to process group deletion");
    } finally {
      setDeleting(false);
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferring(true);
    setTransferError(null);
    try {
      const res = await api.post("/groups/transfer", {
        source_group_id: parseInt(transferData.source_group_id),
        destination_group_id: parseInt(transferData.destination_group_id),
        amount: parseFloat(transferData.amount),
        notes: transferData.notes,
      });
      setNotification({
        type: "success",
        message: res.message || "Transfer completed successfully",
      });
      setIsTransferModalOpen(false);
      setTransferData({
        source_group_id: "",
        destination_group_id: "",
        amount: "1000.00",
        notes: "",
      });
      setTimeout(() => setNotification(null), 5000);
      fetchGroups();
    } catch (err: any) {
      setTransferError(err.message || "Failed to execute transfer");
    } finally {
      setTransferring(false);
    }
  };

  const filteredGroups = groups.filter((g) => {
    const matchesSearch =
      !search ||
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.code.toLowerCase().includes(search.toLowerCase()) ||
      (g.description && g.description.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = !statusFilter || g.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Manage Groups
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Independent financial accounting buckets, isolated balances, and ledgers
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              onClick={() => {
                if (Array.isArray(groups) && groups.length >= 2) {
                  setTransferData((prev) => ({
                    ...prev,
                    source_group_id: String(groups[0].id),
                    destination_group_id: String(groups[1].id),
                  }));
                }
                setIsTransferModalOpen(true);
              }}
              className="btn-secondary"
            >
              <ArrowRightLeft className="h-4 w-4" />
              Transfer Funds
            </button>
          )}
          {canCreate && (
            <button onClick={() => setIsModalOpen(true)} className="btn-primary">
              <Plus className="h-4 w-4" />
              Add Group
            </button>
          )}
        </div>
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

      {/* Search & Filter Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search groups by code, name, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Groups with 3 distinct states: Loading, Error with Retry, Empty */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 text-center py-16">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-600 dark:text-emerald-400" />
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 font-medium">Loading groups...</p>
          </div>
        ) : error ? (
          <div className="col-span-2 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 p-8 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">Unable to load groups</h3>
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 max-w-md mx-auto">
                {error || "Something went wrong while connecting to the server. Please try again."}
              </p>
            </div>
            <button
              onClick={fetchGroups}
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-slate-400 dark:text-slate-500">
            No accounting groups found matching your criteria.
          </div>
        ) : (
          filteredGroups.map((g) => (
            <div
              key={g.id}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                      {g.code}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{g.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={g.status} />
                    {canEdit && (
                      <button
                        onClick={() => openEditModal(g)}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                        title="Edit Group"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => setDeletingGroup(g)}
                        className="rounded p-1 text-rose-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors"
                        title="Archive or Delete Group"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed line-clamp-2">
                  {g.description || "No description provided."}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-100 dark:border-slate-800 mb-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Current Balance</span>
                    <strong className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {formatCurrency(g.current_balance)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Active Members</span>
                    <strong className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {g.total_members}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Qard Hasan Loans</span>
                    <strong className="text-sm font-bold text-blue-700 dark:text-blue-400">
                      {formatCurrency(g.total_qard_outstanding)}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Opening Balance: {formatCurrency(g.opening_balance)}
                </span>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/ledgers?group_id=${g.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-2.5 py-1 text-xs font-medium transition-colors"
                  >
                    <BookOpen className="h-3.5 w-3.5 text-slate-500" />
                    Ledger
                  </Link>
                  <Link
                    href={`/admin/groups/${g.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 px-3 py-1.5 text-xs font-semibold transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Group Details
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Create Accounting Group */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Accounting Group"
      >
        <form onSubmit={handleCreateGroup} className="space-y-4">
          {submitError && (
            <div className="rounded-lg bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
              {submitError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Group Code <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="Leave blank to generate automatically (e.g. G-0001)"
              className="input-field uppercase font-mono"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Format: G-XXXX (e.g. G-0001, G-5000). System will auto-generate next serial if left blank.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Group Name <span className="text-rose-500">*</span>
            </label>
            <input
              required
              type="text"
              placeholder="e.g. Emergency Disaster Relief Fund"
              className="input-field"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Opening Balance (BDT ৳)
            </label>
            <input
              type="number"
              step="0.01"
              className="input-field"
              value={formData.opening_balance}
              onChange={(e) => setFormData({ ...formData, opening_balance: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Purpose and fund allocation rules for this group..."
              className="input-field"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary text-xs"
            >
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Create Group
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Group */}
      {editingGroup && (
        <Modal
          isOpen={!!editingGroup}
          onClose={() => setEditingGroup(null)}
          title={`Edit Group — ${editingGroup.code}`}
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            {editError && (
              <div className="rounded-lg bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
                {editError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Group Code (Format: G-XXXX)
              </label>
              <input
                type="text"
                className="input-field uppercase font-mono"
                placeholder="e.g. G-0001"
                value={editFormData.code}
                onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value.toUpperCase() })}
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Must start with 'G-' prefix.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Group Name *
              </label>
              <input
                required
                type="text"
                className="input-field"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Status *
              </label>
              <select
                required
                className="input-field"
                value={editFormData.status}
                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                className="input-field"
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingGroup(null)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="btn-primary text-xs"
              >
                {savingEdit && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Delete / Archive Confirmation */}
      {deletingGroup && (
        <Modal
          isOpen={!!deletingGroup}
          onClose={() => setDeletingGroup(null)}
          title="Confirm Group Deletion / Archival"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30 p-3 text-xs text-amber-800 dark:text-amber-300">
              <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Financial Integrity Protection Policy:</p>
                <p>
                  Groups are foundational accounting entities. If <strong>{deletingGroup.name}</strong> has active members or financial transactions, it will be <strong>safely archived (marked INACTIVE)</strong> instead of destroying historical double-entry accounting records.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to proceed with deleting or archiving group{" "}
              <strong>{deletingGroup.name} ({deletingGroup.code})</strong>?
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingGroup(null)}
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

      {/* Modal: Transfer Funds */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Transfer Funds Between Accounting Groups"
      >
        <form onSubmit={handleTransferSubmit} className="space-y-4">
          {transferError && (
            <div className="rounded-lg bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
              {transferError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Source Group (Debit/Outflow) *
            </label>
            <select
              required
              className="input-field"
              value={transferData.source_group_id}
              onChange={(e) => setTransferData({ ...transferData, source_group_id: e.target.value })}
            >
              <option value="">Select source group</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id} disabled={String(g.id) === transferData.destination_group_id}>
                  {g.name} ({g.code}) — Balance: {formatCurrency(g.current_balance)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Destination Group (Credit/Inflow) *
            </label>
            <select
              required
              className="input-field"
              value={transferData.destination_group_id}
              onChange={(e) => setTransferData({ ...transferData, destination_group_id: e.target.value })}
            >
              <option value="">Select destination group</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id} disabled={String(g.id) === transferData.source_group_id}>
                  {g.name} ({g.code}) — Balance: {formatCurrency(g.current_balance)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Transfer Amount (BDT ৳) *
            </label>
            <input
              required
              type="number"
              step="0.01"
              className="input-field"
              value={transferData.amount}
              onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Transfer Notes / Authorization Reason
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Allocation for upcoming disaster relief disbursement..."
              className="input-field"
              value={transferData.notes}
              onChange={(e) => setTransferData({ ...transferData, notes: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsTransferModalOpen(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={transferring}
              className="btn-primary text-xs"
            >
              {transferring && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Execute Transfer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
