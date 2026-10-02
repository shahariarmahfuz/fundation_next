"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Scale,
  ArrowLeft,
  Coins,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FolderTree,
  User,
  Calendar,
  Wallet,
  Receipt,
  FileCheck2,
  Check,
  Plus,
  ExternalLink,
  Clock,
  History
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function QardHasanDetailPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const qardId = resolvedParams.id;

  const [loan, setLoan] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLoan = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get(`/qard-hasan/${qardId}`);
      setLoan(data);
    } catch (err: any) {
      setError(err.message || "Failed to load Qard Hasan details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoan();
  }, [qardId]);

  if (loading) {
    return (
      <div className="flex h-72 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error || !loan) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto py-12">
        <div className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 p-5 text-sm text-rose-800 dark:text-rose-300 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <span>{error || "Loan not found."}</span>
        </div>
        <Link href="/admin/qard-hasan" className="btn-secondary text-xs inline-flex items-center gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Manage Qard Hasan
        </Link>
      </div>
    );
  }

  const isCompleted = loan.status === "COMPLETED" || loan.outstanding_amount <= 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin/qard-hasan"
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Manage Qard Hasan
            </Link>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              <Scale className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              Loan: {loan.qard_number}
            </h1>
            <StatusBadge status={loan.status} />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Disbursed on {formatDate(loan.disbursed_date)} • 0% Strictly Interest-Free
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isCompleted && (
            <Link
              href={`/admin/qard-hasan/${loan.id}/repay`}
              className="btn-primary text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Coins className="h-4 w-4" />
              Record Repayment
            </Link>
          )}
          <Link
            href="/admin/qard-hasan/ledger"
            className="btn-secondary text-xs"
          >
            View Ledger
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Principal Amount</span>
          <span className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono">
            {formatCurrency(loan.principal_amount)}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Disbursed capital</span>
        </div>

        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 block tracking-wider">Total Repaid</span>
          <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300 font-mono">
            {formatCurrency(loan.total_repaid)}
          </span>
          <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 block mt-0.5">
            {parseFloat(loan.principal_amount) > 0
              ? `${((parseFloat(loan.total_repaid) / parseFloat(loan.principal_amount)) * 100).toFixed(1)}% recovered`
              : "0%"}
          </span>
        </div>

        <div className="rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/40 dark:bg-blue-950/20 p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-blue-700 dark:text-blue-400 block tracking-wider">Remaining Outstanding</span>
          <span className="text-lg font-bold text-blue-700 dark:text-blue-300 font-mono">
            {formatCurrency(loan.outstanding_amount)}
          </span>
          <span className="text-[10px] text-blue-600/80 dark:text-blue-400/80 block mt-0.5">
            Balance due
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Monthly Rate</span>
          <span className="text-lg font-bold text-slate-700 dark:text-slate-300 font-mono">
            {formatCurrency(loan.monthly_repayment_amount)}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Scheduled monthly installment</span>
        </div>
      </div>

      {/* Beneficiary Profile Card */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
          <User className="h-4 w-4 text-emerald-600" />
          Beneficiary Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Name</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
              {loan.beneficiary?.name}
            </span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Beneficiary Number</span>
            <span className="font-mono text-slate-800 dark:text-slate-200">
              {loan.beneficiary?.beneficiary_number}
            </span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Phone</span>
            <span className="text-slate-800 dark:text-slate-200">
              {loan.beneficiary?.phone || "N/A"}
            </span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Status</span>
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              {loan.beneficiary?.status}
            </span>
          </div>
        </div>
        {loan.beneficiary?.address && (
          <div className="text-xs text-slate-600 dark:text-slate-400 pt-1">
            <strong>Address:</strong> {loan.beneficiary?.address}
          </div>
        )}
      </div>

      {/* Funding Sources Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FolderTree className="h-4 w-4 text-emerald-600" />
            Funding Group Allocations
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {loan.funding_allocations?.length || 0} contributing group(s)
          </span>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden text-xs">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-950/80 text-[11px] font-semibold text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3 text-left">Funding Group</th>
                <th className="py-2.5 px-3 text-right">Allocated Capital</th>
                <th className="py-2.5 px-3 text-right">Repaid to Date</th>
                <th className="py-2.5 px-3 text-right">Remaining Balance</th>
                <th className="py-2.5 px-3 text-center">Txn Ref</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {loan.funding_allocations?.map((fa: any) => {
                const isSettled = parseFloat(fa.outstanding_amount) <= 0;
                return (
                  <tr key={fa.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <FolderTree className="h-3.5 w-3.5 text-emerald-600" />
                      {fa.group?.name || `Group #${fa.group_id}`}
                      {fa.group?.code && (
                        <span className="text-[10px] text-slate-400 font-mono">({fa.group.code})</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300 font-semibold">
                      {formatCurrency(fa.allocated_amount)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                      {formatCurrency(fa.repaid_amount)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(fa.outstanding_amount)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-500">
                      {fa.transaction_id ? `#${fa.transaction_id}` : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-center font-sans">
                      {isSettled ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                          <Check className="h-3 w-3" />
                          Settled
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-bold text-blue-700 bg-blue-100 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Repayments History Log */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <History className="h-4 w-4 text-emerald-600" />
            Repayment History & Proportional Distributions
          </h2>
          {!isCompleted && (
            <Link
              href={`/admin/qard-hasan/${loan.id}/repay`}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <Plus className="h-3 w-3" />
              Add Repayment
            </Link>
          )}
        </div>

        {loan.repayments && loan.repayments.length > 0 ? (
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden text-xs">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-950/80 text-[11px] font-semibold text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 text-left">Receipt #</th>
                  <th className="py-2.5 px-3 text-left">Date</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-left">Method</th>
                  <th className="py-2.5 px-3 text-left">Proportional Return Breakdown</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {loan.repayments.map((rep: any) => (
                  <tr key={rep.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      {rep.repayment_number}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-600 dark:text-slate-400">
                      {formatDate(rep.repayment_date)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700 dark:text-emerald-400">
                      {formatCurrency(rep.amount)}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-600 dark:text-slate-400">
                      {rep.payment_method}
                      {rep.reference && (
                        <span className="text-[10px] text-slate-400 block font-mono">Ref: {rep.reference}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      {rep.allocations && rep.allocations.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {rep.allocations.map((ra: any) => (
                            <span
                              key={ra.id}
                              className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px] font-medium text-slate-700 dark:text-slate-300 font-mono"
                            >
                              <span>{ra.group?.name || `Group #${ra.group_id}`}:</span>
                              <strong className="text-emerald-700 dark:text-emerald-400">
                                {formatCurrency(ra.allocated_amount)}
                              </strong>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-400">
            No repayments have been recorded for this loan yet.
          </div>
        )}
      </div>

      {/* Schedule & Notes */}
      {(loan.repayment_schedule_notes || loan.notes) && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Schedule & Audit Notes
          </h2>
          {loan.repayment_schedule_notes && (
            <div className="text-xs text-slate-700 dark:text-slate-300">
              <strong>Schedule Notes:</strong> {loan.repayment_schedule_notes}
            </div>
          )}
          {loan.notes && (
            <div className="text-xs text-slate-700 dark:text-slate-300">
              <strong>General Notes:</strong> {loan.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
