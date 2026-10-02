"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import {
  FolderTree,
  ArrowLeft,
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  AlertCircle
} from "lucide-react";

export default function GroupDetailsPage() {
  const params = useParams();
  const groupId = params.id as string;

  const [ledgerData, setLedgerData] = useState<any | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLedger = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams();
      if (dateFrom) q.append("date_from", dateFrom);
      if (dateTo) q.append("date_to", dateTo);

      const res = await api.get(`/ledgers/group/${groupId}?${q.toString()}`);
      setLedgerData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load group ledger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [groupId]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLedger();
  };

  if (loading && !ledgerData) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-foundation-700" />
      </div>
    );
  }

  const group = ledgerData?.group;
  const period = ledgerData?.period;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/groups"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {group?.name}
              </h1>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-slate-100 text-slate-800 font-bold">
                {group?.code}
              </span>
              <StatusBadge status={group?.status} />
            </div>
            <p className="text-xs text-slate-500">
              Complete chronological group accounting ledger with running balance
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-800">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Group Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 transition-colors">
          <span className="text-xs text-slate-500 dark:text-slate-400">Initial Opening Capital</span>
          <div className="mt-1 text-xl font-bold text-slate-800 dark:text-white">
            {formatCurrency(group?.initial_opening_balance)}
          </div>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/30 transition-colors">
          <span className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">Period Total Inflows</span>
          <div className="mt-1 text-xl font-bold text-emerald-900 dark:text-emerald-400">
            +{formatCurrency(period?.period_total_inflows)}
          </div>
        </div>

        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-5 dark:border-rose-900/40 dark:bg-rose-950/30 transition-colors">
          <span className="text-xs text-rose-800 dark:text-rose-300 font-medium">Period Total Outflows</span>
          <div className="mt-1 text-xl font-bold text-rose-900 dark:text-rose-400">
            -{formatCurrency(period?.period_total_outflows)}
          </div>
        </div>

        <div className="rounded-xl border border-foundation-300 bg-foundation-50/80 p-5 dark:border-emerald-700/60 dark:bg-emerald-950/50 transition-colors">
          <span className="text-xs text-foundation-800 dark:text-emerald-300 font-bold">Authoritative Current Balance</span>
          <div className="mt-1 text-2xl font-extrabold text-foundation-900 dark:text-white">
            {formatCurrency(group?.authoritative_current_balance)}
          </div>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors">
        <form onSubmit={handleFilterSubmit} className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <span>Filter Period:</span>
          </div>
          <div>
            <input
              type="date"
              className="input-field text-xs py-1.5"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500">to</span>
          <div>
            <input
              type="date"
              className="input-field text-xs py-1.5"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-secondary !py-1.5 !px-3 text-xs">
            <Filter className="h-3.5 w-3.5" />
            Filter Ledger
          </button>
          {(dateFrom || dateTo) && (
            <button
              type="button"
              onClick={() => {
                setDateFrom("");
                setDateTo("");
                fetchLedger();
              }}
              className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white underline transition-colors"
            >
              Reset
            </button>
          )}
        </form>
      </div>

      {/* Group Ledger Table */}
      <div className="table-container">
        <table className="table-custom">
          <thead>
            <tr>
              <th>Date</th>
              <th>Txn Number</th>
              <th>Type</th>
              <th>Description</th>
              <th>Reference</th>
              <th className="text-right">Income (৳)</th>
              <th className="text-right">Expense (৳)</th>
              <th className="text-right">Running Balance (৳)</th>
            </tr>
          </thead>
          <tbody>
            {ledgerData?.entries?.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-slate-400 dark:text-slate-500">
                  No transactions recorded for this group yet.
                </td>
              </tr>
            ) : (
              ledgerData?.entries?.map((e: any) => (
                <tr key={e.id} className={e.is_reversed ? "opacity-60 bg-slate-50/50 dark:bg-rose-950/20" : ""}>
                  <td className="text-xs text-slate-600 dark:text-slate-400">{formatDateTime(e.date)}</td>
                  <td className="font-mono text-xs font-medium text-slate-900 dark:text-white">
                    {e.transaction_number}
                  </td>
                  <td>
                    <StatusBadge status={e.transaction_type} />
                  </td>
                  <td className="text-xs text-slate-700 dark:text-slate-300 max-w-sm truncate" title={e.description}>
                    {e.description}
                    {e.is_reversed && (
                      <span className="ml-2 text-[10px] text-rose-600 dark:text-rose-400 font-bold">
                        (Reversed: {e.reversal_reason})
                      </span>
                    )}
                  </td>
                  <td className="font-mono text-xs text-slate-500 dark:text-slate-400">{e.reference || "-"}</td>
                  <td className="text-right text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    {e.income ? `+${formatCurrency(e.income)}` : "-"}
                  </td>
                  <td className="text-right text-xs font-semibold text-rose-700">
                    {e.expense ? `-${formatCurrency(e.expense)}` : "-"}
                  </td>
                  <td className="text-right font-mono text-xs font-bold text-slate-900">
                    {formatCurrency(e.running_balance)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
