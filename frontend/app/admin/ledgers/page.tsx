"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import { Modal } from "@/components/Modal";
import { Pagination } from "@/components/Pagination";
import {
  BookOpen,
  FolderTree,
  Filter,
  RotateCcw,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  AlertTriangle,
  Loader2,
  AlertCircle,
  CheckCircle,
  FileSpreadsheet
} from "lucide-react";

export default function LedgersPage() {
  const [activeTab, setActiveTab] = useState<"group" | "journal">("group");
  const [groups, setGroups] = useState<any[]>([]);

  // Group Ledger State
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [groupLedgerData, setGroupLedgerData] = useState<any | null>(null);
  const [groupLedgerLoading, setGroupLedgerLoading] = useState(false);
  const [groupLedgerError, setGroupLedgerError] = useState<string | null>(null);

  // Journal (All Transactions) State
  const [txns, setTxns] = useState<any[]>([]);
  const [txnTotal, setTxnTotal] = useState(0);
  const [txnPage, setTxnPage] = useState(1);
  const [txnTotalPages, setTxnTotalPages] = useState(1);
  const [txnLoading, setTxnLoading] = useState(false);
  const [txnError, setTxnError] = useState<string | null>(null);

  // Journal Filters
  const [filterGroup, setFilterGroup] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");
  const [filterFlow, setFilterFlow] = useState<string>("");
  const [filterReversed, setFilterReversed] = useState<string>("");

  // Reversal Modal State
  const [reversalModalOpen, setReversalModalOpen] = useState(false);
  const [selectedTxnForReversal, setSelectedTxnForReversal] = useState<any | null>(null);
  const [reversalReason, setReversalReason] = useState("");
  const [reversing, setReversing] = useState(false);
  const [reversalError, setReversalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch groups list on mount
  useEffect(() => {
    const loadGroups = async () => {
      try {
        const data = await api.get("/groups");
        setGroups(data);
        if (data.length > 0 && !selectedGroupId) {
          setSelectedGroupId(data[0].id);
        }
      } catch (err: any) {
        console.error("Failed to load groups", err);
      }
    };
    loadGroups();
  }, []);

  // Fetch Group Ledger when group or dates change
  const fetchGroupLedger = async () => {
    if (!selectedGroupId) return;
    setGroupLedgerLoading(true);
    setGroupLedgerError(null);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);
      const data = await api.get(`/ledgers/group/${selectedGroupId}?${params.toString()}`);
      setGroupLedgerData(data);
    } catch (err: any) {
      setGroupLedgerError(err.message || "Failed to load group ledger");
    } finally {
      setGroupLedgerLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "group" && selectedGroupId) {
      fetchGroupLedger();
    }
  }, [selectedGroupId, activeTab]);

  // Fetch Journal Transactions
  const fetchJournalTransactions = async () => {
    setTxnLoading(true);
    setTxnError(null);
    try {
      const params = new URLSearchParams({
        page: txnPage.toString(),
        page_size: "25",
      });
      if (filterGroup) params.append("group_id", filterGroup);
      if (filterType) params.append("transaction_type", filterType);
      if (filterFlow) params.append("flow_type", filterFlow);
      if (filterReversed !== "") params.append("is_reversed", filterReversed);
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);

      const data = await api.get(`/transactions?${params.toString()}`);
      setTxns(data.items);
      setTxnTotal(data.total);
      setTxnTotalPages(data.total_pages);
    } catch (err: any) {
      setTxnError(err.message || "Failed to load transactions");
    } finally {
      setTxnLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "journal") {
      fetchJournalTransactions();
    }
  }, [activeTab, txnPage, filterGroup, filterType, filterFlow, filterReversed]);

  const handleApplyDateFilter = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === "group") {
      fetchGroupLedger();
    } else {
      setTxnPage(1);
      fetchJournalTransactions();
    }
  };

  const handleOpenReversal = (txn: any) => {
    setSelectedTxnForReversal(txn);
    setReversalReason("");
    setReversalError(null);
    setReversalModalOpen(true);
  };

  const handleExecuteReversal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTxnForReversal || !reversalReason.trim()) {
      setReversalError("Please provide a substantive reversal reason");
      return;
    }

    setReversing(true);
    setReversalError(null);
    try {
      await api.post(`/transactions/${selectedTxnForReversal.id}/reverse`, {
        reversal_reason: reversalReason.trim(),
      });
      setSuccessMessage(`Transaction ${selectedTxnForReversal.transaction_number} reversed successfully.`);
      setReversalModalOpen(false);
      setTimeout(() => setSuccessMessage(null), 5000);
      
      // Refresh current view
      if (activeTab === "group") {
        fetchGroupLedger();
      } else {
        fetchJournalTransactions();
      }
    } catch (err: any) {
      setReversalError(err.message || "Failed to reverse transaction");
    } finally {
      setReversing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Accounting Ledgers & Journal
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Audit-grade double-entry transaction books and group ledger statements
          </p>
        </div>

        {/* View Switcher */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
          <button
            onClick={() => setActiveTab("group")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "group"
                ? "bg-white text-emerald-700 shadow-sm dark:bg-slate-900 dark:text-emerald-400"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <FolderTree className="h-4 w-4" />
            Group Balance Ledger
          </button>
          <button
            onClick={() => setActiveTab("journal")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "journal"
                ? "bg-white text-emerald-700 shadow-sm dark:bg-slate-900 dark:text-emerald-400"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            General Journal (All Txns)
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300">
          <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Date Filter Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors">
        <form onSubmit={handleApplyDateFilter} className="flex flex-wrap items-center gap-4">
          {activeTab === "group" && (
            <div className="w-full sm:w-64">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Accounting Group
              </label>
              <select
                value={selectedGroupId || ""}
                onChange={(e) => setSelectedGroupId(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    [{g.code}] {g.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="w-full sm:w-44">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="w-full sm:w-44">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-end self-end pt-5">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-colors"
            >
              <Filter className="h-4 w-4" />
              Filter Records
            </button>
            {(dateFrom || dateTo) && (
              <button
                type="button"
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                  setTimeout(() => {
                    if (activeTab === "group") fetchGroupLedger();
                    else fetchJournalTransactions();
                  }, 50);
                }}
                className="ml-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </form>
      </div>

      {/* TAB 1: GROUP LEDGER */}
      {activeTab === "group" && (
        <div className="space-y-6">
          {groupLedgerLoading && (
            <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <span className="ml-3 text-slate-600 dark:text-slate-300 font-medium">Computing running balances...</span>
            </div>
          )}

          {groupLedgerError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
              {groupLedgerError}
            </div>
          )}

          {groupLedgerData && !groupLedgerLoading && (
            <>
              {/* Group Balance Summary Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Period Opening Balance
                  </div>
                  <div className="mt-2 text-xl font-bold text-slate-800 dark:text-white">
                    {formatCurrency(groupLedgerData.period.period_opening_balance)}
                  </div>
                  <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    Pre-period cumulative
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/30 transition-colors">
                  <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    Period Total Inflows (+)
                  </div>
                  <div className="mt-2 text-xl font-bold text-emerald-700 dark:text-emerald-400">
                    +{formatCurrency(groupLedgerData.period.period_total_inflows)}
                  </div>
                  <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-300">
                    Contributions, Repayments, Inflows
                  </div>
                </div>

                <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-5 shadow-sm dark:border-rose-900/40 dark:bg-rose-950/30 transition-colors">
                  <div className="text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                    Period Total Outflows (-)
                  </div>
                  <div className="mt-2 text-xl font-bold text-rose-700 dark:text-rose-400">
                    -{formatCurrency(groupLedgerData.period.period_total_outflows)}
                  </div>
                  <div className="mt-1 text-xs text-rose-600 dark:text-rose-300">
                    Expenses, Qard Disbursed, Sadakah
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Period Closing Balance
                  </div>
                  <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                    {formatCurrency(groupLedgerData.period.period_closing_balance)}
                  </div>
                  <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    At period end date
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-600 to-teal-700 p-5 text-white shadow-md">
                  <div className="text-xs font-semibold uppercase tracking-wider text-emerald-100">
                    Authoritative Current Liquidity
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-white">
                    {formatCurrency(groupLedgerData.group.authoritative_current_balance)}
                  </div>
                  <div className="mt-1 text-xs text-emerald-100">
                    Live balance across all journal events
                  </div>
                </div>
              </div>

              {/* Group Ledger Table */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors">
                <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60">
                      {groupLedgerData.group.code}
                    </span>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {groupLedgerData.group.name} — Statement of Ledger Entries
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Showing {groupLedgerData.entries.length} transactions
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-3 font-semibold">Date & Txn #</th>
                        <th className="px-6 py-3 font-semibold">Type & Reference</th>
                        <th className="px-6 py-3 font-semibold">Description</th>
                        <th className="px-6 py-3 font-semibold text-right text-emerald-700 dark:text-emerald-400">Debit (Inflow +)</th>
                        <th className="px-6 py-3 font-semibold text-right text-rose-700 dark:text-rose-400">Credit (Outflow -)</th>
                        <th className="px-6 py-3 font-semibold text-right text-slate-900 dark:text-white">Running Balance</th>
                        <th className="px-6 py-3 font-semibold text-center">Status</th>
                        <th className="px-6 py-3 font-semibold text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {/* Period Opening Balance Row */}
                      <tr className="bg-slate-50/80 font-medium text-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
                        <td className="px-6 py-3" colSpan={3}>
                          Beginning Balance for Period
                        </td>
                        <td className="px-6 py-3 text-right">-</td>
                        <td className="px-6 py-3 text-right">-</td>
                        <td className="px-6 py-3 text-right font-bold text-slate-900 dark:text-white">
                          {formatCurrency(groupLedgerData.period.period_opening_balance)}
                        </td>
                        <td className="px-6 py-3 text-center">
                          <span className="text-xs text-slate-400 dark:text-slate-500">OPENING</span>
                        </td>
                        <td className="px-6 py-3 text-center">-</td>
                      </tr>

                      {groupLedgerData.entries.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-10 text-center text-slate-400 dark:text-slate-500">
                            No ledger transactions recorded in this date range.
                          </td>
                        </tr>
                      ) : (
                        groupLedgerData.entries.map((entry: any) => (
                          <tr
                            key={entry.id}
                            className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                              entry.is_reversed ? "bg-rose-50/30 dark:bg-rose-950/20 line-through opacity-75" : ""
                            }`}
                          >
                            <td className="px-6 py-4">
                              <div className="font-semibold text-slate-900 dark:text-white">{formatDate(entry.date)}</div>
                              <div className="text-xs font-mono text-slate-400 dark:text-slate-500">{entry.transaction_number}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-medium text-slate-800 dark:text-slate-200 text-xs">
                                {entry.transaction_type.replace(/_/g, " ")}
                              </div>
                              {entry.reference && (
                                <div className="text-xs text-slate-400 dark:text-slate-500">Ref: {entry.reference}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 max-w-xs truncate text-slate-700 dark:text-slate-300">
                              {entry.description}
                              {entry.is_reversed && entry.reversal_reason && (
                                <div className="text-xs text-rose-600 dark:text-rose-400 no-underline font-normal">
                                  Reversal reason: {entry.reversal_reason}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                              {entry.income ? `+${formatCurrency(entry.income)}` : "-"}
                            </td>
                            <td className="px-6 py-4 text-right font-semibold text-rose-600 dark:text-rose-400">
                              {entry.expense ? `-${formatCurrency(entry.expense)}` : "-"}
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">
                              {formatCurrency(entry.running_balance)}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {entry.is_reversed ? (
                                <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 dark:border dark:border-rose-900/50">
                                  REVERSED
                                </span>
                              ) : (
                                <StatusBadge status={entry.flow_type} />
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {!entry.is_reversed && entry.transaction_type !== "CORRECTION" && (
                                <button
                                  onClick={() => handleOpenReversal(entry)}
                                  title="Reverse this transaction"
                                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 hover:border-rose-300 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-rose-700 dark:hover:text-rose-400 transition-colors"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                  Reverse
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: GENERAL JOURNAL (ALL TRANSACTIONS) */}
      {activeTab === "journal" && (
        <div className="space-y-4">
          {/* Quick Filters */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 bg-white p-4 rounded-2xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 transition-colors">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Group</label>
              <select
                value={filterGroup}
                onChange={(e) => {
                  setFilterGroup(e.target.value);
                  setTxnPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Flow Type</label>
              <select
                value={filterFlow}
                onChange={(e) => {
                  setFilterFlow(e.target.value);
                  setTxnPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="">All Flows</option>
                <option value="INFLOW">INFLOW (+)</option>
                <option value="OUTFLOW">OUTFLOW (-)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Transaction Type</label>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setTxnPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="">All Types</option>
                <option value="CONTRIBUTION">Contribution</option>
                <option value="EXPENSE">Expense</option>
                <option value="QARD_HASAN_DISBURSEMENT">Qard Hasan Disbursement</option>
                <option value="QARD_HASAN_REPAYMENT">Qard Hasan Repayment</option>
                <option value="SADAKAH">Sadakah Aid</option>
                <option value="DONATION">Donation</option>
                <option value="TRANSFER_IN">Transfer In</option>
                <option value="TRANSFER_OUT">Transfer Out</option>
                <option value="REVERSAL">Reversal</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Status</label>
              <select
                value={filterReversed}
                onChange={(e) => {
                  setFilterReversed(e.target.value);
                  setTxnPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="">All Statuses</option>
                <option value="false">Active Only</option>
                <option value="true">Reversed Only</option>
              </select>
            </div>
          </div>

          {/* Transactions List */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Txn #</th>
                    <th className="px-6 py-3 font-semibold">Date</th>
                    <th className="px-6 py-3 font-semibold">Group</th>
                    <th className="px-6 py-3 font-semibold">Type</th>
                    <th className="px-6 py-3 font-semibold text-right">Amount</th>
                    <th className="px-6 py-3 font-semibold">Description</th>
                    <th className="px-6 py-3 font-semibold text-center">Status</th>
                    <th className="px-6 py-3 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {txnLoading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-600" />
                        <span className="mt-2 block text-xs text-slate-500 dark:text-slate-400">Loading journal records...</span>
                      </td>
                    </tr>
                  ) : txns.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-10 text-center text-slate-400 dark:text-slate-500">
                        No transactions matched the criteria.
                      </td>
                    </tr>
                  ) : (
                    txns.map((t) => (
                      <tr
                        key={t.id}
                        className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                          t.is_reversed ? "bg-rose-50/30 dark:bg-rose-950/20 line-through opacity-75" : ""
                        }`}
                      >
                        <td className="px-6 py-4 font-mono font-medium text-slate-900 dark:text-white">
                          {t.transaction_number}
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{formatDate(t.transaction_date)}</td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {t.group?.name || `Group #${t.group_id}`}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                            {t.flow_type === "INFLOW" ? (
                              <ArrowDownLeft className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <ArrowUpRight className="h-3 w-3 text-rose-600 dark:text-rose-400" />
                            )}
                            {t.transaction_type.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">
                          {t.flow_type === "INFLOW" ? (
                            <span className="text-emerald-600 dark:text-emerald-400">+{formatCurrency(t.amount)}</span>
                          ) : (
                            <span className="text-rose-600 dark:text-rose-400">-{formatCurrency(t.amount)}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 max-w-xs truncate text-slate-600 dark:text-slate-300">
                          {t.description}
                          {t.is_reversed && t.reversal_reason && (
                            <div className="text-xs text-rose-600 dark:text-rose-400 no-underline font-normal">
                              Reason: {t.reversal_reason}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {t.is_reversed ? (
                            <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 dark:border dark:border-rose-900/50">
                              REVERSED
                            </span>
                          ) : (
                            <StatusBadge status={t.flow_type} />
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {!t.is_reversed && t.transaction_type !== "CORRECTION" && (
                            <button
                              onClick={() => handleOpenReversal(t)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 hover:border-rose-300 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-rose-700 dark:hover:text-rose-400 transition-colors"
                            >
                              <RotateCcw className="h-3 w-3" />
                              Reverse
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              page={txnPage}
              totalPages={txnTotalPages}
              total={txnTotal}
              pageSize={25}
              onPageChange={setTxnPage}
            />
          </div>
        </div>
      )}

      {/* Reversal Confirmation Modal */}
      <Modal
        isOpen={reversalModalOpen}
        onClose={() => setReversalModalOpen(false)}
        title="Confirm Transaction Reversal"
      >
        <form onSubmit={handleExecuteReversal} className="space-y-4">
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-200 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Audit Notice:</strong> Reversing this transaction will generate an offsetting
              contra-entry in the journal, post an audit log, and adjust the group balance accordingly.
              This action cannot be undone.
            </div>
          </div>

          {selectedTxnForReversal && (
            <div className="rounded-xl bg-slate-50 p-3 text-sm space-y-1 border border-slate-200 dark:bg-slate-950/60 dark:border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Transaction:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {selectedTxnForReversal.transaction_number}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Amount:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatCurrency(selectedTxnForReversal.amount || selectedTxnForReversal.income || selectedTxnForReversal.expense)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Type / Flow:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedTxnForReversal.transaction_type} ({selectedTxnForReversal.flow_type})
                </span>
              </div>
            </div>
          )}

          {reversalError && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300">
              {reversalError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Reversal Reason *
            </label>
            <textarea
              required
              rows={3}
              value={reversalReason}
              onChange={(e) => setReversalReason(e.target.value)}
              placeholder="e.g. Duplicate entry recorded by mistake, client check returned unpaid..."
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setReversalModalOpen(false)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={reversing}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
            >
              {reversing && <Loader2 className="h-4 w-4 animate-spin" />}
              Execute Reversal
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
