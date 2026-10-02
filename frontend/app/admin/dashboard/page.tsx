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
  FolderTree,
  Building2,
  ExternalLink,
  ShieldCheck
} from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/dashboard");
      // Seamlessly support both { success: true, data: { ... } } and direct object
      const data = res?.data || res;
      setStats(data);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data");
      // CRITICAL: NEVER overwrite previously loaded stats with zero or null!
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // 1. Initial Loading State: Skeletons (Never display fake ৳0.00 while loading!)
  if (loading && !stats) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-7 w-48 rounded-lg bg-slate-200 dark:bg-[#151515]" />
            <div className="h-4 w-72 rounded bg-slate-100 dark:bg-[#101010]" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-24 rounded-lg bg-slate-200 dark:bg-[#151515]" />
            <div className="h-9 w-36 rounded-lg bg-slate-200 dark:bg-[#151515]" />
          </div>
        </div>

        {/* Top Liquidity Card Skeleton */}
        <div className="rounded-2xl border border-slate-200 dark:border-[#1A1A1A] bg-white dark:bg-[#0A0A0A] p-8 h-48" />

        {/* Group Cards Skeleton */}
        <div className="space-y-3">
          <div className="h-5 w-40 rounded bg-slate-200 dark:bg-[#151515]" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-36 rounded-xl border border-slate-200 dark:border-[#1A1A1A] bg-white dark:bg-[#0A0A0A]" />
            ))}
          </div>
        </div>

        {/* Flow Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl border border-slate-200 dark:border-[#1A1A1A] bg-white dark:bg-[#0A0A0A]" />
          ))}
        </div>
      </div>
    );
  }

  // 2. Fatal Initial Error State (NO previous data available)
  // NEVER fall back to fake ৳0.00! Show clear error with retry action.
  if (error && !stats) {
    return (
      <div className="py-12 px-4 max-w-xl mx-auto space-y-6">
        <div className="rounded-2xl border border-rose-300 dark:border-[#242424] bg-white dark:bg-[#0A0A0A] p-8 text-center shadow-lg space-y-4">
          <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50">
            <AlertCircle className="h-7 w-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-[#F5F5F5]">
              Financial Data Could Not Be Loaded
            </h2>
            <p className="text-xs text-slate-500 dark:text-[#A3A3A3] leading-relaxed">
              Unable to retrieve real-time financial balances and accounting aggregates from the database.
              No temporary or placeholder zero values are displayed to protect financial integrity.
            </p>
          </div>
          <div className="rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/70 dark:bg-rose-950/30 p-3 text-xs text-rose-700 dark:text-rose-400 font-mono text-center">
            {error}
          </div>
          <div className="pt-2">
            <button
              onClick={fetchDashboard}
              disabled={loading}
              className="btn-primary text-xs !py-2.5 !px-5 inline-flex items-center justify-center gap-2 shadow-md w-full sm:w-auto"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Retry Loading Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Normal State (or Error with previous stats safely preserved)
  return (
    <div className="space-y-8 transition-colors pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-[#F5F5F5]">
            Executive Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-[#737373]">
            Real-time financial status, group balances, and operational aggregates
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDashboard}
            disabled={loading}
            className="btn-secondary !py-2 !px-3 text-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link href="/admin/contributions/receive" className="btn-primary !py-2 !px-3 text-xs inline-flex items-center gap-1.5">
            <PlusCircle className="h-3.5 w-3.5" />
            Receive Contribution
          </Link>
        </div>
      </div>

      {/* Warning Banner when a refresh failed, but previous data is safely preserved */}
      {error && stats && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-300 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 p-4 text-xs sm:text-sm text-amber-900 dark:text-amber-200 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-bold">Unable to load the latest financial data</p>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                Your previously loaded data is still shown. Please click Retry to update.
              </p>
            </div>
          </div>
          <button
            onClick={fetchDashboard}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition shrink-0 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Retry
          </button>
        </div>
      )}

      {/* Top Total Foundation Balance Highlight (AMOLED-Inspired subtle gradient, no navy) */}
      <div className="rounded-2xl border border-emerald-500/30 dark:border-[#1E382B] bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-950 dark:bg-gradient-to-br dark:from-[#091B11] dark:via-[#06130C] dark:to-[#0A0A0A] p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" />
                Authoritative Foundation Liquidity
              </span>
            </div>
            <div className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white font-mono">
              {formatCurrency(stats?.total_foundation_balance)}
            </div>
            <p className="text-xs text-slate-300 dark:text-[#A3A3A3] max-w-xl leading-relaxed">
              Consolidated net sum across all {stats?.total_groups || 0} active financial groups.
              Derived dynamically from reconciled double-entry transactions.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t sm:border-t-0 sm:border-l border-emerald-800/80 dark:border-[#1A1A1A] pt-4 sm:pt-0 sm:pl-6 text-left shrink-0">
            <div>
              <span className="text-[11px] text-slate-300 dark:text-[#737373]">Total Members</span>
              <div className="text-xl font-bold text-white mt-0.5 font-mono">
                {stats?.total_members} <span className="text-xs text-emerald-400 font-normal">({stats?.active_members} active)</span>
              </div>
            </div>
            <div>
              <span className="text-[11px] text-slate-300 dark:text-[#737373]">Due Contributions</span>
              <div className="text-xl font-bold text-amber-300 mt-0.5 font-mono">
                {formatCurrency(stats?.total_due_contributions)}
              </div>
            </div>
            <div>
              <span className="text-[11px] text-slate-300 dark:text-[#737373]">Total Donations</span>
              <div className="text-xl font-bold text-white mt-0.5 font-mono">
                {formatCurrency(stats?.total_donations)}
              </div>
            </div>
            <div>
              <span className="text-[11px] text-slate-300 dark:text-[#737373]">Outstanding Qard</span>
              <div className="text-xl font-bold text-blue-300 dark:text-emerald-300 mt-0.5 font-mono">
                {formatCurrency(stats?.total_qard_outstanding)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Group Balances Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-[#F5F5F5]">
            Financial Groups & Balances
          </h2>
          <Link href="/admin/groups" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300">
            View All Groups →
          </Link>
        </div>

        {stats?.groups?.length === 0 ? (
          <div className="rounded-xl border border-slate-200 dark:border-[#1A1A1A] bg-white dark:bg-[#0A0A0A] p-8 text-center text-slate-400 dark:text-[#737373]">
            No financial groups configured yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats?.groups?.map((g: any) => (
              <Link
                key={g.id}
                href={`/admin/groups/${g.id}`}
                className="group rounded-xl border border-slate-200 dark:border-[#1A1A1A] bg-white dark:bg-[#0A0A0A] p-5 shadow-sm hover:border-emerald-500 dark:hover:border-emerald-600/50 dark:hover:bg-[#0F0F0F] hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#737373] mb-2">
                  <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-[#151515] text-slate-700 dark:text-[#A3A3A3]">
                    {g.code}
                  </span>
                  <span>{g.members_count} members</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-[#F5F5F5] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                  {g.name}
                </h3>
                <div className="mt-3 text-lg sm:text-xl font-extrabold text-slate-900 dark:text-[#F5F5F5] font-mono">
                  {formatCurrency(g.balance)}
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 dark:text-[#737373]">
                  <span>Group Account</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold group-hover:underline">Ledger →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Operational Flow Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-[#1A1A1A] bg-white dark:bg-[#0A0A0A] p-5 transition-colors">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 dark:text-[#737373]">Total Member Collections</span>
              <div className="text-lg font-bold text-slate-900 dark:text-[#F5F5F5] font-mono">
                {formatCurrency(stats?.total_collection)}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-[#1A1A1A] bg-white dark:bg-[#0A0A0A] p-5 transition-colors">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 dark:text-[#737373]">Total Expenses</span>
              <div className="text-lg font-bold text-slate-900 dark:text-[#F5F5F5] font-mono">
                {formatCurrency(stats?.total_expenses)}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-[#1A1A1A] bg-white dark:bg-[#0A0A0A] p-5 transition-colors">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 dark:text-[#737373]">Qard Hasan (Receivable)</span>
              <div className="text-lg font-bold text-slate-900 dark:text-[#F5F5F5] font-mono">
                {formatCurrency(stats?.total_qard_outstanding)}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-[#1A1A1A] bg-white dark:bg-[#0A0A0A] p-5 transition-colors">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400">
              <Heart className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 dark:text-[#737373]">Sadakah Relief Disbursed</span>
              <div className="text-lg font-bold text-slate-900 dark:text-[#F5F5F5] font-mono">
                {formatCurrency(stats?.total_sadakah)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Financial Transactions Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-[#F5F5F5]">
            Recent Financial Transactions
          </h2>
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
                  <td colSpan={8} className="text-center py-8 text-slate-400 dark:text-[#737373]">
                    No transactions recorded yet.
                  </td>
                </tr>
              ) : (
                stats?.recent_transactions?.map((t: any) => (
                  <tr key={t.id}>
                    <td className="font-mono text-xs font-medium text-slate-900 dark:text-[#F5F5F5]">
                      {t.transaction_number}
                    </td>
                    <td className="text-xs text-slate-500 dark:text-[#737373]">{formatDateTime(t.transaction_date)}</td>
                    <td className="text-xs font-semibold text-slate-800 dark:text-[#D4D4D4]">
                      {t.group?.name || `Group #${t.group_id}`}
                    </td>
                    <td>
                      <StatusBadge status={t.transaction_type} />
                    </td>
                    <td className="text-xs text-slate-600 dark:text-[#A3A3A3] max-w-xs truncate" title={t.description}>
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
                    <td className="text-right font-mono text-xs text-slate-700 dark:text-[#D4D4D4]">
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
