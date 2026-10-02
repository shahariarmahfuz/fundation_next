"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Coins,
  Receipt,
  Scale,
  Heart,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  PlusCircle,
  Loader2,
  RefreshCw,
  FolderTree
} from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get("/dashboard");
      setStats(data);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Executive Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time financial status, group balances, and operational aggregates
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboard}
            disabled={loading}
            className="btn-secondary !py-1.5 !px-3 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link href="/admin/contributions?action=record" className="btn-primary !py-1.5 !px-3 text-xs">
            <PlusCircle className="h-3.5 w-3.5" />
            Record Payment
          </Link>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 p-4 text-xs sm:text-sm text-rose-800 dark:text-rose-400">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Top Total Foundation Balance Highlight */}
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-950 p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Authoritative Foundation Liquidity
            </span>
            <div className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
              {formatCurrency(stats?.total_foundation_balance)}
            </div>
            <p className="text-xs text-slate-300 max-w-xl">
              Consolidated sum across all {stats?.total_groups || 0} active financial groups.
              Derived dynamically from reconciled double-entry transactions.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t sm:border-t-0 sm:border-l border-emerald-800/80 pt-4 sm:pt-0 sm:pl-6 text-left">
            <div>
              <span className="text-[11px] text-slate-300">Total Members</span>
              <div className="text-xl font-bold text-white mt-0.5">
                {stats?.total_members} <span className="text-xs text-emerald-400 font-normal">({stats?.active_members} active)</span>
              </div>
            </div>
            <div>
              <span className="text-[11px] text-slate-300">Due Contributions</span>
              <div className="text-xl font-bold text-amber-300 mt-0.5">
                {formatCurrency(stats?.total_due_contributions)}
              </div>
            </div>
            <div>
              <span className="text-[11px] text-slate-300">Total Donations</span>
              <div className="text-xl font-bold text-white mt-0.5">
                {formatCurrency(stats?.total_donations)}
              </div>
            </div>
            <div>
              <span className="text-[11px] text-slate-300">Outstanding Qard</span>
              <div className="text-xl font-bold text-blue-300 mt-0.5">
                {formatCurrency(stats?.total_qard_outstanding)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Group Balances Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Financial Groups & Balances</h2>
          <Link href="/admin/groups" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300">
            View All Groups →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats?.groups?.map((g: any) => (
            <Link
              key={g.id}
              href={`/admin/groups/${g.id}`}
              className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {g.code}
                </span>
                <span>{g.members_count} members</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {g.name}
              </h3>
              <div className="mt-3 text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                {formatCurrency(g.balance)}
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                <span>Group Account</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold group-hover:underline">Ledger →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Operational Flow Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-colors">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400">Total Member Collections</span>
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                {formatCurrency(stats?.total_collection)}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-colors">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400">Total Expenses</span>
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                {formatCurrency(stats?.total_expenses)}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-colors">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400">Qard Hasan (Receivable)</span>
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                {formatCurrency(stats?.total_qard_outstanding)}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-colors">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400">
              <Heart className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400">Sadakah Relief Disbursed</span>
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                {formatCurrency(stats?.total_sadakah)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Financial Transactions Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Financial Transactions</h2>
          <Link href="/admin/ledgers" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300">
            Open Full Ledger →
          </Link>
        </div>

        <div className="table-container">
          <table className="table-custom">
            <thead>
              <tr>
                <th>Txn Number</th>
                <th>Date</th>
                <th>Group</th>
                <th>Type</th>
                <th>Description</th>
                <th>Flow</th>
                <th className="text-right">Amount</th>
                <th className="text-right">Balance After</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recent_transactions?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400 dark:text-slate-500">
                    No transactions recorded yet.
                  </td>
                </tr>
              ) : (
                stats?.recent_transactions?.map((t: any) => (
                  <tr key={t.id}>
                    <td className="font-mono text-xs font-medium text-slate-900 dark:text-slate-100">
                      {t.transaction_number}
                    </td>
                    <td className="text-xs text-slate-500 dark:text-slate-400">{formatDateTime(t.transaction_date)}</td>
                    <td className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {t.group?.name || `Group #${t.group_id}`}
                    </td>
                    <td>
                      <StatusBadge status={t.transaction_type} />
                    </td>
                    <td className="text-xs text-slate-600 dark:text-slate-300 max-w-xs truncate" title={t.description}>
                      {t.description}
                    </td>
                    <td>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold ${
                          t.flow_type === "INFLOW" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {t.flow_type === "INFLOW" ? (
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDownLeft className="h-3.5 w-3.5" />
                        )}
                        {t.flow_type}
                      </span>
                    </td>
                    <td
                      className={`text-right font-semibold text-sm ${
                        t.flow_type === "INFLOW" ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"
                      }`}
                    >
                      {t.flow_type === "INFLOW" ? "+" : "-"}
                      {formatCurrency(t.amount)}
                    </td>
                    <td className="text-right font-mono text-xs text-slate-700 dark:text-slate-300">
                      {formatCurrency(t.balance_after)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
