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
  Home,
  Scale,
  Heart,
  Receipt,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Pencil,
  User,
  Users,
  CreditCard,
  FileText,
  Camera,
  PenTool,
  ExternalLink,
  ShieldCheck
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
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const b = history?.beneficiary;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/beneficiaries"
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors shadow-xs"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {b?.name}
              </h1>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800">
                {b?.beneficiary_number || b?.code}
              </span>
              <StatusBadge status={b?.status} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Assistance profile, personal records, loan repayment history, and welfare aid grants.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/admin/beneficiaries/${beneficiaryId}/edit`}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors shadow-xs"
          >
            <Pencil className="h-4 w-4" />
            Edit Profile
          </Link>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 p-4 text-xs sm:text-sm text-rose-800 dark:text-rose-300">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Financial Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400">Total Qard Received</span>
          <div className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">
            {formatCurrency(b?.total_qard_received || 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Interest-free loan disbursements</div>
        </div>

        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 p-5 shadow-xs">
          <span className="text-xs text-emerald-800 dark:text-emerald-400 font-medium">Total Qard Repaid</span>
          <div className="mt-1 text-xl font-bold text-emerald-900 dark:text-emerald-300">
            {formatCurrency(b?.total_qard_repaid || 0)}
          </div>
          <div className="text-[11px] text-emerald-600/80 dark:text-emerald-400/70 mt-0.5">Direct principal repayments</div>
        </div>

        <div className="rounded-2xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-950/20 p-5 shadow-xs">
          <span className="text-xs text-blue-800 dark:text-blue-400 font-medium">Outstanding Qard Balance</span>
          <div className="mt-1 text-xl font-bold text-blue-900 dark:text-blue-300">
            {formatCurrency(b?.total_qard_outstanding || 0)}
          </div>
          <div className="text-[11px] text-blue-600/80 dark:text-blue-400/70 mt-0.5">Remaining repayment balance</div>
        </div>

        <div className="rounded-2xl border border-purple-200 dark:border-purple-800/60 bg-purple-50/50 dark:bg-purple-950/20 p-5 shadow-xs">
          <span className="text-xs text-purple-800 dark:text-purple-400 font-medium">Total Sadakah Received</span>
          <div className="mt-1 text-xl font-bold text-purple-900 dark:text-purple-300">
            {formatCurrency(b?.total_sadakah_received || 0)}
          </div>
          <div className="text-[11px] text-purple-600/80 dark:text-purple-400/70 mt-0.5">Non-repayable charity grants</div>
        </div>
      </div>

      {/* Beneficiary Profile Details: Personal, Emergency, Documents, Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Details Card */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Personal &amp; Contact Details
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Full Name
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {b?.name}
              </span>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Father / Husband&apos;s Name
              </span>
              <span className="text-slate-800 dark:text-slate-200">
                {b?.father_or_husband_name || "—"}
              </span>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                National ID / Passport
              </span>
              <span className="font-mono text-slate-800 dark:text-slate-200">
                {b?.nid_or_id || "—"}
              </span>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Mobile Number
              </span>
              <span className="text-slate-800 dark:text-slate-200">
                {b?.phone || "—"}
              </span>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Present Address
              </span>
              <span className="text-slate-800 dark:text-slate-200">
                {b?.present_address || b?.address || "—"}
              </span>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Permanent Address
              </span>
              <span className="text-slate-800 dark:text-slate-200">
                {b?.permanent_address || "—"}
              </span>
            </div>
          </div>

          {/* Emergency Contact Sub-section */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
              <Phone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Emergency Contact
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-xs text-slate-500 block">Name</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {b?.emergency_contact_name || "—"}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Relation</span>
                <span className="text-slate-800 dark:text-slate-200">
                  {b?.emergency_contact_relation || "—"}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Mobile</span>
                <span className="text-slate-800 dark:text-slate-200">
                  {b?.emergency_contact_phone || "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {b?.notes && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-slate-400" />
                Circumstances / Background Notes
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                {b.notes}
              </p>
            </div>
          )}
        </div>

        {/* Documents & Media Column */}
        <div className="space-y-6">
          {/* Photo & Signature Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Camera className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Photo &amp; Signature
            </h2>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-4 items-center">
              {/* Photo */}
              <div className="text-center w-full">
                <span className="text-xs text-slate-500 block mb-1.5 font-medium">Beneficiary Photo</span>
                {b?.photo_url ? (
                  <div className="inline-block relative">
                    <img
                      src={b.photo_url}
                      alt={b.name}
                      className="h-28 w-28 object-cover rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs mx-auto"
                    />
                    <a
                      href={b.photo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:underline mt-1 font-medium"
                    >
                      <ExternalLink className="h-3 w-3" /> Full View
                    </a>
                  </div>
                ) : (
                  <div className="h-24 w-24 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                    <User className="h-10 w-10 stroke-1" />
                  </div>
                )}
              </div>

              {/* Signature */}
              <div className="text-center w-full pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500 block mb-1.5 font-medium">Signature</span>
                {b?.signature_url ? (
                  <div>
                    <img
                      src={b.signature_url}
                      alt="Signature"
                      className="h-16 w-36 object-contain bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-700 p-1 mx-auto"
                    />
                    <a
                      href={b.signature_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:underline mt-1 font-medium"
                    >
                      <ExternalLink className="h-3 w-3" /> Full View
                    </a>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">No signature on file</span>
                )}
              </div>
            </div>
          </div>

          {/* Attached Documents */}
          {(b?.nid_front_url || b?.nid_back_url) && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-3 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Attached Identification
              </h2>
              {b.id_document_type && (
                <div className="text-xs text-slate-500 font-medium">
                  Type: <span className="text-slate-800 dark:text-slate-200 font-semibold">{b.id_document_type}</span>
                </div>
              )}
              <div className="space-y-2">
                {b.nid_front_url && (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">Front Document</span>
                    <a
                      href={b.nid_front_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-600 hover:underline font-semibold flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" /> View
                    </a>
                  </div>
                )}
                {b.nid_back_url && (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">Back Document</span>
                    <a
                      href={b.nid_back_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-600 hover:underline font-semibold flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" /> View
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
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
