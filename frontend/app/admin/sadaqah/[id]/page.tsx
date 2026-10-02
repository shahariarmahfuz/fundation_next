"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Heart,
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
  History,
  ShieldCheck
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SadaqahDetailPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const grantId = resolvedParams.id;

  const [grant, setGrant] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGrant = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get(`/sadaqah/${grantId}`);
      setGrant(data);
    } catch (err: any) {
      setError(err.message || "Failed to load Sadaqah grant details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrant();
  }, [grantId]);

  if (loading) {
    return (
      <div className="flex h-72 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
      </div>
    );
  }

  if (error || !grant) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto py-12">
        <div className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 p-5 text-sm text-rose-800 dark:text-rose-300 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <span>{error || "Sadaqah grant not found."}</span>
        </div>
        <Link href="/admin/sadaqah" className="btn-secondary text-xs inline-flex items-center gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Manage Sadaqah
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin/sadaqah"
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Manage Sadaqah
            </Link>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              <Heart className="h-6 w-6 text-rose-600 dark:text-rose-400 fill-rose-100 dark:fill-rose-950/40" />
              Grant: {grant.sadakah_number}
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 px-3 py-0.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              100% Non-Repayable
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Disbursed on {formatDate(grant.disbursement_date)} • Permanent capital outflow to registered beneficiary
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/sadaqah/new"
            className="btn-primary text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            New Sadaqah
          </Link>
          <Link href="/admin/sadaqah/ledger" className="btn-secondary text-xs">
            View Ledger
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Total Disbursed</span>
          <span className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono">
            {formatCurrency(grant.amount)}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Non-repayable assistance</span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Disbursement Date</span>
          <span className="text-base font-bold text-slate-900 dark:text-slate-100 font-sans">
            {formatDate(grant.disbursement_date)}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Date funds provided</span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Payment Method</span>
          <span className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono">
            {grant.payment_method}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Mode of disbursement</span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Voucher / Ref</span>
          <span className="text-base font-bold text-slate-700 dark:text-slate-300 font-mono truncate block">
            {grant.reference || "None"}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Audit transaction code</span>
        </div>
      </div>

      {/* Beneficiary Profile Card */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
          <User className="h-4 w-4 text-emerald-600" />
          Beneficiary Details (Recipient)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Name</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
              {grant.beneficiary?.name}
            </span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Beneficiary Code</span>
            <span className="font-mono text-slate-800 dark:text-slate-200">
              {grant.beneficiary?.beneficiary_number}
            </span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Phone</span>
            <span className="text-slate-800 dark:text-slate-200">
              {grant.beneficiary?.phone || "N/A"}
            </span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Status</span>
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              {grant.beneficiary?.status}
            </span>
          </div>
        </div>
        {grant.beneficiary?.address && (
          <div className="text-xs text-slate-600 dark:text-slate-400 pt-1">
            <strong>Address:</strong> {grant.beneficiary?.address}
          </div>
        )}
      </div>

      {/* Purpose & Relief Notes */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
          <FileCheck2 className="h-4 w-4 text-rose-600" />
          Relief Purpose & Notes
        </h2>
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {grant.description}
        </div>
        {grant.notes && (
          <div className="text-xs text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800 mt-2">
            <strong>Internal Notes:</strong> {grant.notes}
          </div>
        )}
      </div>

      {/* Funding Sources Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FolderTree className="h-4 w-4 text-emerald-600" />
            Funding Group Allocations (Permanently Debited)
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {grant.funding_allocations?.length || (grant.group ? 1 : 0)} contributing group(s)
          </span>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden text-xs">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-950/80 text-[11px] font-semibold text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3 text-left">Funding Group</th>
                <th className="py-2.5 px-3 text-right">Contributed Amount</th>
                <th className="py-2.5 px-3 text-center">Txn Ref</th>
                <th className="py-2.5 px-3 text-center">Accounting Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {grant.funding_allocations && grant.funding_allocations.length > 0 ? (
                grant.funding_allocations.map((fa: any) => (
                  <tr key={fa.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <FolderTree className="h-3.5 w-3.5 text-emerald-600" />
                      {fa.group?.name || `Group #${fa.group_id}`}
                      {fa.group?.code && (
                        <span className="text-[10px] text-slate-400 font-mono">({fa.group.code})</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-900 dark:text-slate-100 font-bold">
                      {formatCurrency(fa.allocated_amount)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-500">
                      {fa.transaction_id ? `#${fa.transaction_id}` : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-center font-sans">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 dark:bg-rose-950 dark:text-rose-300 px-2 py-0.5 rounded-full">
                        Capital Outflow (Debited)
                      </span>
                    </td>
                  </tr>
                ))
              ) : grant.group ? (
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-2.5 px-3 font-sans font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <FolderTree className="h-3.5 w-3.5 text-emerald-600" />
                    {grant.group.name}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-900 dark:text-slate-100 font-bold">
                    {formatCurrency(grant.amount)}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-500">
                    {grant.transaction_id ? `#${grant.transaction_id}` : "—"}
                  </td>
                  <td className="py-2.5 px-3 text-center font-sans">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 dark:bg-rose-950 dark:text-rose-300 px-2 py-0.5 rounded-full">
                      Capital Outflow (Debited)
                    </span>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
