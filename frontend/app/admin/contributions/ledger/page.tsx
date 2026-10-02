"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import { Pagination } from "@/components/Pagination";
import { Modal } from "@/components/Modal";
import { useFlash } from "@/lib/flash";
import {
  BookOpen,
  ArrowDownLeft,
  Filter,
  RotateCcw,
  Plus,
  Coins,
  ArrowLeft,
  Building2,
  Calendar,
  AlertTriangle,
  Loader2,
  FileSpreadsheet,
  CheckCircle2,
  Search
} from "lucide-react";

export default function ContributionLedgerPage() {
  const { flash } = useFlash();

  const [txns, setTxns] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Filters
  const [selectedGroup, setSelectedGroup] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterReversed, setFilterReversed] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Summary Metrics
  const [totalInflow, setTotalInflow] = useState(0);

  // Reversal Modal
  const [reversalModalOpen, setReversalModalOpen] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<any | null>(null);
  const [reversalReason, setReversalReason] = useState("");
  const [reversing, setReversing] = useState(false);
  const [reversalError, setReversalError] = useState<string | null>(null);

  // Load groups on mount
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const data = await api.get("/groups");
        setGroups(data || []);
      } catch (err) {
        console.error("Failed to load groups", err);
      }
    };
    fetchGroups();
  }, []);

  // Fetch contribution transactions
  const fetchContributionLedger = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
        transaction_type: "CONTRIBUTION",
      });

      if (selectedGroup) params.append("group_id", selectedGroup);
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);
      if (filterReversed !== "") params.append("is_reversed", filterReversed);

      const res = await api.get(`/transactions?${params.toString()}`);
      setTxns(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.total_pages || 1);

      // Compute total sum of current items for quick card
      const sum = (res.items || []).reduce((acc: number, item: any) => {
        if (!item.is_reversed && item.flow_type === "INFLOW") {
          return acc + parseFloat(item.amount || "0");
        }
        return acc;
      }, 0);
      setTotalInflow(sum);
    } catch (err: any) {
      setError(err.message || "Failed to load contribution ledger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContributionLedger();
  }, [page, pageSize, selectedGroup, dateFrom, dateTo, filterReversed]);

  // Handle Contra-Entry Reversal
  const handleReversalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTxn) return;
    if (!reversalReason.trim()) {
      setReversalError("Please provide a valid reason for this contra-entry reversal.");
      return;
    }

    setReversing(true);
    setReversalError(null);

    try {
      await api.post(`/transactions/${selectedTxn.id}/reverse`, {
        reason: reversalReason.trim(),
      });

      flash.success(
        "Transaction Reversed",
        `Contra-entry reversal posted for ${selectedTxn.transaction_number}. Group balance has been restored.`
      );

      setReversalModalOpen(false);
      setSelectedTxn(null);
      setReversalReason("");
      fetchContributionLedger();
    } catch (err: any) {
      setReversalError(err.message || "Failed to reverse transaction");
    } finally {
      setReversing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Accounting & General Journal</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Contribution Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Double-entry journal records, group credits, and contra-entry audit trail for member contributions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/contributions/receive" className="btn-primary">
            <Plus className="h-4 w-4" />
            Receive Contribution
          </Link>
          <Link href="/admin/contributions" className="btn-secondary">
            Manage Contributions
          </Link>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 p-4 text-xs sm:text-sm text-rose-800 dark:text-rose-300">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Total Ledger Entries
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{total}</span>
            <span className="text-xs text-slate-400">contributions</span>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Inflow on Page
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalInflow)}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Accounting Rule
          </span>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
            Transactions are immutable. Corrections require a signed contra-entry reversal.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Filter by Group
            </label>
            <select
              value={selectedGroup}
              onChange={(e) => {
                setSelectedGroup(e.target.value);
                setPage(1);
              }}
              className="input-field py-1.5 text-xs"
            >
              <option value="">All Groups</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              From Date
            </label>
            <input
              type="date"
              className="input-field py-1.5 text-xs"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              To Date
            </label>
            <input
              type="date"
              className="input-field py-1.5 text-xs"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Reversal Status
            </label>
            <select
              value={filterReversed}
              onChange={(e) => {
                setFilterReversed(e.target.value);
                setPage(1);
              }}
              className="input-field py-1.5 text-xs"
            >
              <option value="">All Entries</option>
              <option value="false">Active Only</option>
              <option value="true">Reversed Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Txn #</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Group Credited</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Method & Ref</th>
                <th className="py-3 px-4 text-right">Inflow Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-500 mb-2" />
                    Loading contribution journal...
                  </td>
                </tr>
              ) : txns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No contribution transactions recorded in the ledger yet.
                  </td>
                </tr>
              ) : (
                txns.map((t) => (
                  <tr
                    key={t.id}
                    className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                      t.is_reversed ? "opacity-60 bg-slate-50/30 dark:bg-slate-950/20" : ""
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {t.transaction_number}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {formatDateTime(t.transaction_date)}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                      {t.group?.name || `Group #${t.group_id}`}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {t.description}
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{t.payment_method}</span>
                      {t.reference && <span className="block font-mono text-[10px]">{t.reference}</span>}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(t.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {t.is_reversed ? (
                        <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          REVERSED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          ACTIVE
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {!t.is_reversed ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTxn(t);
                            setReversalReason("");
                            setReversalError(null);
                            setReversalModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline cursor-pointer"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Reverse
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400">Reversed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </div>

      {/* Reversal Confirmation Modal */}
      <Modal
        isOpen={reversalModalOpen}
        onClose={() => setReversalModalOpen(false)}
        title="Post Contra-Entry Reversal"
      >
        {selectedTxn && (
          <form onSubmit={handleReversalSubmit} className="space-y-4">
            <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3 text-xs text-amber-900 dark:text-amber-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <h4 className="font-bold">Strict Audit Ledger Invariant</h4>
                  <p className="mt-0.5 leading-relaxed">
                    This action will not delete {selectedTxn.transaction_number}. Instead, it writes a signed contra-entry transaction reversing <strong>{formatCurrency(selectedTxn.amount)}</strong> from {selectedTxn.group?.name || `Group #${selectedTxn.group_id}`}.
                  </p>
                </div>
              </div>
            </div>

            {reversalError && (
              <div className="rounded-lg bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                {reversalError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reason for Reversal *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Explain the reason for reversing this contribution..."
                className="input-field text-xs resize-none"
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setReversalModalOpen(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={reversing}
                className="btn-primary !bg-rose-600 hover:!bg-rose-700 !border-rose-600 text-white"
              >
                {reversing && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm Contra-Entry Reversal
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
