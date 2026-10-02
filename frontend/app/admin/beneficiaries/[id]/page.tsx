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
  AlertCircle
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
      <div className="flex items-center gap-3">
        <Link
          href="/admin/beneficiaries"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{b?.name}</h1>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
              {b?.beneficiary_number}
            </span>
            <StatusBadge status={b?.status} />
          </div>
          <p className="text-xs text-slate-500">
            Assistance profile, interest-free loan history, and sadakah grants
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-800">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <span className="text-xs text-slate-500">Total Qard Received</span>
          <div className="mt-1 text-xl font-bold text-slate-900">
            {formatCurrency(b?.total_qard_received)}
          </div>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5">
          <span className="text-xs text-emerald-800 font-medium">Total Qard Repaid</span>
          <div className="mt-1 text-xl font-bold text-emerald-900">
            {formatCurrency(b?.total_qard_repaid)}
          </div>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5">
          <span className="text-xs text-blue-800 font-medium">Outstanding Qard Balance</span>
          <div className="mt-1 text-xl font-bold text-blue-900">
            {formatCurrency(b?.total_qard_outstanding)}
          </div>
        </div>

        <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-5">
          <span className="text-xs text-purple-800 font-medium">Total Sadakah Received</span>
          <div className="mt-1 text-xl font-bold text-purple-900">
            {formatCurrency(b?.total_sadakah_received)}
          </div>
        </div>
      </div>

      {/* Qard Hasan Loans Table */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Scale className="h-4 w-4 text-blue-600" />
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
                  <tr key={q.id}>
                    <td className="font-mono text-xs font-semibold text-slate-900">{q.qard_number}</td>
                    <td className="text-xs text-slate-500">{formatDate(q.disbursed_date)}</td>
                    <td className="font-bold text-xs text-slate-900">{formatCurrency(q.principal_amount)}</td>
                    <td className="text-xs text-slate-700">{formatCurrency(q.monthly_repayment_amount)}/mo</td>
                    <td className="text-xs text-emerald-700 font-semibold">{formatCurrency(q.total_repaid)}</td>
                    <td className="text-xs text-blue-700 font-bold">{formatCurrency(q.outstanding_amount)}</td>
                    <td className="text-xs font-bold text-emerald-600">0%</td>
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
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Heart className="h-4 w-4 text-purple-600" />
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
                  <tr key={s.id}>
                    <td className="font-mono text-xs font-semibold text-slate-900">{s.sadakah_number}</td>
                    <td className="text-xs text-slate-500">{formatDate(s.disbursement_date)}</td>
                    <td className="text-xs text-slate-800">{s.description}</td>
                    <td className="font-mono text-xs text-slate-500">{s.reference || "-"}</td>
                    <td className="text-right font-bold text-xs text-purple-700">{formatCurrency(s.amount)}</td>
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
