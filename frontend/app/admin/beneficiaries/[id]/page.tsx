"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import {
  HandHeart,
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Scale,
  Heart,
  Receipt,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Pencil
} from "lucide-react";

export default function BeneficiaryProfilePage() {
  const params = useParams();
  const beneficiaryId = params.id as string;

  const [history, setHistory] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get(`/beneficiaries/${beneficiaryId}/assistance-history`);
      setHistory(data);
    } catch (err: any) {
      setError(err.message || "Failed to load beneficiary history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [beneficiaryId]);

  if (loading && !history) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-foundation-700" />
      </div>
    );
  }

  const b = history?.beneficiary;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/beneficiaries"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{b?.name}</h1>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                {b?.beneficiary_number}
              </span>
              <StatusBadge status={b?.status} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Assistance profile, interest-free loan history, and sadakah grants
            </p>
          </div>
        </div>

        <Link
          href={`/admin/beneficiaries/${beneficiaryId}/edit`}
          className="btn-secondary"
        >
          <Pencil className="h-4 w-4" />
          Edit Beneficiary
        </Link>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 p-4 text-xs sm:text-sm text-rose-800 dark:text-rose-300">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <span className="text-xs text-slate-500 dark:text-slate-400">Total Qard Received</span>
          <div className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">
            {formatCurrency(b?.total_qard_received)}
          </div>
        </div>

        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 p-5">
          <span className="text-xs text-emerald-800 dark:text-emerald-400 font-medium">Total Qard Repaid</span>
          <div className="mt-1 text-xl font-bold text-emerald-900 dark:text-emerald-300">
            {formatCurrency(b?.total_qard_repaid)}
          </div>
        </div>

        <div className="rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-950/20 p-5">
          <span className="text-xs text-blue-800 dark:text-blue-400 font-medium">Outstanding Qard Balance</span>
          <div className="mt-1 text-xl font-bold text-blue-900 dark:text-blue-300">
            {formatCurrency(b?.total_qard_outstanding)}
          </div>
        </div>

        <div className="rounded-xl border border-purple-200 dark:border-purple-800/60 bg-purple-50/50 dark:bg-purple-950/20 p-5">
          <span className="text-xs text-purple-800 dark:text-purple-400 font-medium">Total Sadakah Received</span>
          <div className="mt-1 text-xl font-bold text-purple-900 dark:text-purple-300">
            {formatCurrency(b?.total_sadakah_received)}
          </div>
        </div>
      </div>

      {/* Qard Hasan Loans Table */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Scale className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span>Qard Hasan Loans (Interest = 0%)</span>
        </h3>

        <div className="table-container">
          <table className="table-custom">
            <thead>
              <tr>
                <th>Loan No.</th>
                <th>Disbursed Date</th>
                <th>Principal</th>
                <th>Monthly Repayment</th>
                <th>Total Repaid</th>
                <th>Outstanding</th>
                <th>Interest</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {!history?.qard_hasan_loans || history.qard_hasan_loans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-slate-400">
                    No Qard Hasan loans disbursed to this beneficiary.
                  </td>
                </tr>
              ) : (
                history.qard_hasan_loans.map((q: any) => (
                  <tr key={q.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">{q.qard_number}</td>
                    <td className="text-xs text-slate-500 dark:text-slate-400">{formatDate(q.disbursed_date)}</td>
                    <td className="font-bold text-xs text-slate-900 dark:text-slate-100">{formatCurrency(q.principal_amount)}</td>
                    <td className="text-xs text-slate-700 dark:text-slate-300">{formatCurrency(q.monthly_repayment_amount)}/mo</td>
                    <td className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">{formatCurrency(q.total_repaid)}</td>
                    <td className="text-xs text-blue-700 dark:text-blue-400 font-bold">{formatCurrency(q.outstanding_amount)}</td>
                    <td className="text-xs font-bold text-emerald-600 dark:text-emerald-400">0%</td>
                    <td>
                      <StatusBadge status={q.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sadakah Grants Table */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Heart className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <span>Sadakah Aid Grants (Non-Repayable)</span>
        </h3>

        <div className="table-container">
          <table className="table-custom">
            <thead>
              <tr>
                <th>Grant No.</th>
                <th>Date</th>
                <th>Description</th>
                <th>Reference</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {!history?.sadakah_grants || history.sadakah_grants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-slate-400">
                    No Sadakah grants disbursed to this beneficiary.
                  </td>
                </tr>
              ) : (
                history.sadakah_grants.map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">{s.sadakah_number}</td>
                    <td className="text-xs text-slate-500 dark:text-slate-400">{formatDate(s.disbursement_date)}</td>
                    <td className="text-xs text-slate-800 dark:text-slate-200">{s.description}</td>
                    <td className="font-mono text-xs text-slate-500 dark:text-slate-400">{s.reference || "-"}</td>
                    <td className="text-right font-bold text-xs text-purple-700 dark:text-purple-400">{formatCurrency(s.amount)}</td>
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
