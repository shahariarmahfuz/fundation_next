"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api, getStoredUser } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import { Modal } from "@/components/Modal";
import { useFlash, getUserFriendlyErrorMessage } from "@/lib/flash";
import { CustomSelect } from "@/components/ui/custom-select";
import {
  FolderTree,
  Plus,
  ArrowRightLeft,
  Users,
  Eye,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  Search,
  Scale
} from "lucide-react";

export default function ManageGroupsPage() {
  const { flash } = useFlash();
  const [user, setUser] = useState<any | null>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

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

  const handleConfirmDelete = async () => {
    if (!deletingGroup) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/groups/${deletingGroup.id}`);
      setDeletingGroup(null);
      if (res.archived) {
        flash.warning("Group archived", res.message || "Group has active records, so it was set to INACTIVE.");
      } else {
        flash.success("Group deleted successfully", res.message || "Group removed.");
      }
      fetchGroups();
    } catch (err: any) {
      flash.error("Unable to delete group", getUserFriendlyErrorMessage(err));
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
      flash.success("Transfer completed", res.message || "Funds transferred successfully between groups.");
      setIsTransferModalOpen(false);
      setTransferData({
        source_group_id: "",
        destination_group_id: "",
        amount: "1000.00",
        notes: "",
      });
      fetchGroups();
    } catch (err: any) {
      setTransferError(getUserFriendlyErrorMessage(err));
    } finally {
      setTransferring(false);
    }
  };

  const openTransferModalForGroup = (sourceGroup: any) => {
    const otherGroup = groups.find((g) => g.id !== sourceGroup.id);
    setTransferData({
      source_group_id: String(sourceGroup.id),
      destination_group_id: otherGroup ? String(otherGroup.id) : "",
      amount: "1000.00",
      notes: "",
    });
    setTransferError(null);
    setIsTransferModalOpen(true);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foundation-50 text-foundation-700 dark:bg-foundation-950/50 dark:text-foundation-400 border border-foundation-100 dark:border-foundation-900">
              <FolderTree className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Manage Groups
            </h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Independent financial accounting buckets, isolated balances, and ledgers
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
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
                setTransferError(null);
                setIsTransferModalOpen(true);
              }}
              className="btn-secondary inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold"
            >
              <ArrowRightLeft className="h-4 w-4" />
              Transfer Funds
            </button>
          )}
          {canCreate && (
            <Link
              href="/admin/groups/new"
              className="btn-primary inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Add Group
            </Link>
          )}
        </div>
      </div>

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
              className="input-field pl-9 text-xs"
            />
          </div>
          <div className="w-40">
            <CustomSelect
              value={statusFilter}
              onChange={(val) => setStatusFilter(String(val))}
              options={[
                { value: "", label: "All Statuses" },
                { value: "ACTIVE", label: "ACTIVE" },
                { value: "INACTIVE", label: "INACTIVE" },
              ]}
              searchable={false}
              triggerClassName="py-1.5 text-xs h-9"
            />
          </div>
        </div>
      </div>

      {/* Error Card with Retry Button */}
      {error && (
        <div className="rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 p-6 text-center space-y-3">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">Unable to load groups</h3>
            <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 max-w-md mx-auto">
              {error}
            </p>
          </div>
          <button
            onClick={fetchGroups}
            type="button"
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Groups Table: exact layout matching Manage Members */}
      <div className="table-container">
        <table className="table-custom">
          <thead>
            <tr>
              <th>GROUP CODE</th>
              <th>GROUP NAME</th>
              <th>STATUS</th>
              <th className="text-right">CURRENT BALANCE</th>
              <th className="text-center">ACTIVE MEMBERS</th>
              <th className="text-right">QARD HASAN</th>
              <th className="text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-foundation-700" />
                  <span className="mt-2 block text-xs text-slate-400">Loading accounting groups...</span>
                </td>
              </tr>
            ) : filteredGroups.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400 dark:text-slate-500">
                  {search ? "No groups found matching your search." : "No accounting groups registered yet."}
                </td>
              </tr>
            ) : (
              filteredGroups.map((group) => (
                <tr key={group.id}>
                  <td className="font-mono text-xs font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                    <Link
                      href={`/admin/groups/${group.id}`}
                      className="text-foundation-700 dark:text-foundation-400 hover:underline"
                    >
                      {group.code}
                    </Link>
                  </td>
                  <td>
                    <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                      {group.name}
                    </div>
                    {group.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate" title={group.description}>
                        {group.description}
                      </p>
                    )}
                  </td>
                  <td>
                    <StatusBadge status={group.status} />
                  </td>
                  <td className="text-right font-mono font-bold text-xs sm:text-sm text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                    {formatCurrency(group.current_balance ?? 0)}
                  </td>
                  <td className="text-center">
                    <span className="inline-flex items-center gap-1 font-mono font-semibold text-xs text-slate-700 dark:text-slate-300">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      {group.total_members ?? 0}
                    </span>
                  </td>
                  <td className="text-right font-mono font-semibold text-xs text-amber-700 dark:text-amber-400 whitespace-nowrap">
                    {formatCurrency(group.total_qard_outstanding ?? 0)}
                  </td>
                  <td className="text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/admin/groups/${group.id}`}
                        className="inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors"
                        title="View Group Details & Ledger"
                      >
                        <Eye className="h-3.5 w-3.5 text-foundation-700 dark:text-foundation-400" />
                        <span className="hidden xl:inline">Details</span>
                      </Link>

                      {canEdit && (
                        <Link
                          href={`/admin/groups/${group.id}/edit`}
                          className="inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors"
                          title="Edit Group"
                        >
                          <Edit className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                          <span className="hidden xl:inline">Edit</span>
                        </Link>
                      )}

                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => openTransferModalForGroup(group)}
                          className="inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors"
                          title="Transfer Funds from this Group"
                        >
                          <ArrowRightLeft className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="hidden xl:inline">Transfer</span>
                        </button>
                      )}

                      {canDelete && (
                        <button
                          onClick={() => setDeletingGroup(group)}
                          className="inline-flex items-center gap-1 rounded bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 px-2 py-1 text-xs font-medium text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                          title="Delete or Archive Group"
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

      {/* Delete Confirmation Modal */}
      {deletingGroup && (
        <Modal
          isOpen={true}
          onClose={() => setDeletingGroup(null)}
          title={`Confirm Removal of ${deletingGroup.name}`}
        >
          <div className="space-y-4">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Are you sure you want to remove{" "}
              <strong className="text-slate-900 dark:text-white">
                {deletingGroup.name} ({deletingGroup.code})
              </strong>
              ?
            </p>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300 space-y-1">
              <p className="font-bold">Accounting Safety Protocol</p>
              <p>
                If this group has recorded members or ledger transactions, it will be safely{" "}
                <strong>archived and marked INACTIVE</strong> to preserve historical audit trails.
              </p>
            </div>
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
                className="btn-danger text-xs inline-flex items-center gap-1.5"
              >
                {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirm Delete / Archive
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Transfer Funds Modal */}
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
            <CustomSelect
              required
              value={transferData.source_group_id}
              onChange={(val) => setTransferData({ ...transferData, source_group_id: String(val) })}
              options={groups.map((g) => ({
                value: String(g.id),
                label: `${g.name} (${g.code})`,
                sublabel: `Balance: ${formatCurrency(g.current_balance)}`,
                disabled: String(g.id) === transferData.destination_group_id,
              }))}
              placeholder="Select source group"
              searchable={true}
              searchPlaceholder="Search source group..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Destination Group (Credit/Inflow) *
            </label>
            <CustomSelect
              required
              value={transferData.destination_group_id}
              onChange={(val) => setTransferData({ ...transferData, destination_group_id: String(val) })}
              options={groups.map((g) => ({
                value: String(g.id),
                label: `${g.name} (${g.code})`,
                sublabel: `Balance: ${formatCurrency(g.current_balance)}`,
                disabled: String(g.id) === transferData.source_group_id,
              }))}
              placeholder="Select destination group"
              searchable={true}
              searchPlaceholder="Search destination group..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Transfer Amount (BDT ৳) *
            </label>
            <input
              required
              type="number"
              step="0.01"
              min="0.01"
              className="input-field text-xs font-mono font-bold"
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
              className="input-field text-xs resize-y"
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
