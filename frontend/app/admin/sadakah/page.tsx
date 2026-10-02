"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Pagination } from "@/components/Pagination";
import { Modal } from "@/components/Modal";
import {
  Heart,
  Plus,
  FolderTree,
  User,
  AlertCircle,
  Loader2
} from "lucide-react";

export default function SadakahPage() {
  const [grants, setGrants] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    group_id: "",
    beneficiary_id: "",
    amount: "2000.00",
    disbursement_date: new Date().toISOString().split("T")[0],
    payment_method: "CASH",
    description: "Emergency medical / ration assistance",
    reference: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchDropdowns = async () => {
    try {
      const [g, b] = await Promise.all([
        api.get("/groups"),
        api.get("/beneficiaries?page=1&page_size=100"),
      ]);
      setGroups(g);
      setBeneficiaries(b.items);
      if (g.length > 0) setFormData((prev) => ({ ...prev, group_id: String(g[0].id) }));
      if (b.items.length > 0) setFormData((prev) => ({ ...prev, beneficiary_id: String(b.items[0].id) }));
    } catch {}
  };

  const fetchGrants = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });
      const res = await api.get(`/sadakah?${params.toString()}`);
      setGrants(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err: any) {
      setError(err.message || "Failed to load Sadakah records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchGrants();
  }, [page, pageSize]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.post("/sadakah", {
        ...formData,
        group_id: parseInt(formData.group_id),
        beneficiary_id: parseInt(formData.beneficiary_id),
        amount: parseFloat(formData.amount),
      });
      setModalOpen(false);
      fetchGrants();
    } catch (err: any) {
      setSubmitError(err.message || "Failed to disburse Sadakah");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sadakah Relief Aid</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Non-repayable direct humanitarian disbursements to registered beneficiaries
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <Plus className="h-4 w-4" />
          Disburse Sadakah Aid
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-800">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="table-container">
        <table className="table-custom">
          <thead>
            <tr>
              <th>Grant Number</th>
              <th>Date</th>
              <th>Beneficiary</th>
              <th>Source Group</th>
              <th>Description</th>
              <th>Reference</th>
              <th>Payment Method</th>
              <th className="text-right">Amount (৳)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-foundation-700" />
                </td>
              </tr>
            ) : grants.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-400">
                  No Sadakah grants recorded yet.
                </td>
              </tr>
            ) : (
              grants.map((g) => (
                <tr key={g.id}>
                  <td className="font-mono text-xs font-semibold text-slate-900">
                    {g.sadakah_number}
                  </td>
                  <td className="text-xs text-slate-500">{formatDate(g.disbursement_date)}</td>
                  <td>
                    <div className="font-semibold text-xs text-slate-900">{g.beneficiary?.name}</div>
                    <div className="text-[10px] text-slate-400">{g.beneficiary?.phone}</div>
                  </td>
                  <td>
                    <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      <FolderTree className="h-3 w-3 text-foundation-700" />
                      {g.group?.name}
                    </span>
                  </td>
                  <td className="text-xs text-slate-700 max-w-sm truncate" title={g.description}>
                    {g.description}
                  </td>
                  <td className="font-mono text-xs text-slate-500">{g.reference || "-"}</td>
                  <td className="font-mono text-xs text-slate-600">{g.payment_method}</td>
                  <td className="text-right font-bold text-xs text-purple-700">
                    {formatCurrency(g.amount)}
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

      {/* Modal: Disburse Sadakah */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Disburse Non-Repayable Sadakah Aid"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {submitError && (
            <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              {submitError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Beneficiary (Recipient) <span className="text-rose-500">*</span>
            </label>
            <select
              required
              className="input-field"
              value={formData.beneficiary_id}
              onChange={(e) => setFormData({ ...formData, beneficiary_id: e.target.value })}
            >
              {beneficiaries.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.phone}) — {b.beneficiary_number}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Source Group <span className="text-rose-500">*</span>
            </label>
            <select
              required
              className="input-field font-semibold"
              value={formData.group_id}
              onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} (Balance: {formatCurrency(g.current_balance)})
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-slate-400">
              Money permanently reduces this group balance. No receivable is created.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Amount (৳ BDT) <span className="text-rose-500">*</span>
            </label>
            <input
              required
              type="number"
              step="100"
              className="input-field"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Purpose / Description <span className="text-rose-500">*</span>
            </label>
            <input
              required
              type="text"
              placeholder="e.g. Flood relief food basket distribution"
              className="input-field"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                className="input-field"
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              >
                <option value="CASH">CASH</option>
                <option value="BKASH">BKASH</option>
                <option value="NAGAD">NAGAD</option>
                <option value="BANK_TRANSFER">BANK TRANSFER</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
              <input
                required
                type="date"
                className="input-field"
                value={formData.disbursement_date}
                onChange={(e) => setFormData({ ...formData, disbursement_date: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Disburse Sadakah
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
