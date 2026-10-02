"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
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
  Loader2,
  AlertCircle,
  ArrowRightLeft,
  CheckCircle2
} from "lucide-react";

export default function GroupsListPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);

  const fetchGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get("/groups");
      setGroups(data);
    } catch (err: any) {
      setError(err.message || "Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.post("/groups", {
        ...formData,
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
      fetchGroups();
    } catch (err: any) {
      setSubmitError(err.message || "Failed to create group");
    } finally {
      setSubmitting(false);
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
      setTransferSuccess(res.message || "Transfer completed successfully");
      setIsTransferModalOpen(false);
      setTransferData({
        source_group_id: "",
        destination_group_id: "",
        amount: "1000.00",
        notes: "",
      });
      setTimeout(() => setTransferSuccess(null), 5000);
      fetchGroups();
    } catch (err: any) {
      setTransferError(err.message || "Failed to execute transfer");
    } finally {
      setTransferring(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Accounting Groups</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Independent financial accounting buckets inside the foundation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (groups.length >= 2) {
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
          <button onClick={() => setIsModalOpen(true)} className="btn-primary">
            <Plus className="h-4 w-4" />
            Create Accounting Group
          </button>
        </div>
      </div>

      {transferSuccess && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs sm:text-sm text-emerald-800">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <span>{transferSuccess}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-800">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid of Groups */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 text-center py-12">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-foundation-700" />
          </div>
        ) : (
          groups.map((g) => (
            <div
              key={g.id}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-800">
                      {g.code}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{g.name}</h3>
                  </div>
                  <StatusBadge status={g.status} />
                </div>

                <p className="text-xs text-slate-500 mb-5 leading-relaxed line-clamp-2">
                  {g.description || "No description provided."}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100 mb-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Current Balance</span>
                    <strong className="text-sm font-extrabold text-slate-900">
                      {formatCurrency(g.current_balance)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Active Members</span>
                    <strong className="text-sm font-bold text-slate-800">{g.total_members}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Qard Hasan Loans</span>
                    <strong className="text-sm font-bold text-blue-700">
                      {formatCurrency(g.total_qard_outstanding)}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Opening Balance: {formatCurrency(g.opening_balance)}
                </span>
                <Link
                  href={`/admin/groups/${g.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-foundation-50 hover:bg-foundation-100 text-foundation-800 px-3 py-1.5 text-xs font-semibold transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View Group Ledger
                </Link>
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
            <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              {submitError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Group Code <span className="text-rose-500">*</span>
            </label>
            <input
              required
              type="text"
              placeholder="e.g. DIS (Disaster Relief)"
              className="input-field uppercase font-mono"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Group Name <span className="text-rose-500">*</span>
            </label>
            <input
              required
              type="text"
              placeholder="e.g. Disaster & Crisis Group"
              className="input-field"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Opening Balance (৳ BDT)
            </label>
            <input
              type="number"
              step="100"
              placeholder="0.00"
              className="input-field"
              value={formData.opening_balance}
              onChange={(e) => setFormData({ ...formData, opening_balance: e.target.value })}
            />
            <p className="mt-1 text-[11px] text-slate-400">
              The initial capital allocated to this accounting group.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="Specify the purpose of this financial group..."
              className="input-field"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Group
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Transfer Funds Between Groups */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Inter-Group Fund Transfer"
      >
        <form onSubmit={handleTransferSubmit} className="space-y-4">
          {transferError && (
            <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              {transferError}
            </div>
          )}

          <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 border border-slate-200 leading-relaxed">
            Move capital from one foundation accounting group to another. Atomically generates paired
            <code className="text-rose-700 mx-1">TRANSFER_OUT</code> and
            <code className="text-emerald-700 mx-1">TRANSFER_IN</code> journal records with full audit trail.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Source Group (Debit/Outflow) <span className="text-rose-500">*</span>
            </label>
            <select
              required
              className="input-field font-semibold"
              value={transferData.source_group_id}
              onChange={(e) => setTransferData({ ...transferData, source_group_id: e.target.value })}
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  [{g.code}] {g.name} (Available: {formatCurrency(g.current_balance)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Destination Group (Credit/Inflow) <span className="text-rose-500">*</span>
            </label>
            <select
              required
              className="input-field font-semibold"
              value={transferData.destination_group_id}
              onChange={(e) => setTransferData({ ...transferData, destination_group_id: e.target.value })}
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  [{g.code}] {g.name} (Current: {formatCurrency(g.current_balance)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Transfer Amount (৳ BDT) <span className="text-rose-500">*</span>
            </label>
            <input
              required
              type="number"
              step="100"
              min="1"
              placeholder="0.00"
              className="input-field"
              value={transferData.amount}
              onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Transfer Purpose / Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Reallocate general funds to cover emergency medical relief shortfall"
              className="input-field"
              value={transferData.notes}
              onChange={(e) => setTransferData({ ...transferData, notes: e.target.value })}
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsTransferModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={transferring} className="btn-primary">
              {transferring && <Loader2 className="h-4 w-4 animate-spin" />}
              Execute Transfer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
