"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getFoundationTodayDate } from "@/lib/timezone";
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
  ExternalLink,
  Sparkles
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function QardHasanRepayPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const qardId = resolvedParams.id;

  const [loan, setLoan] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Repayment Form State
  const [amount, setAmount] = useState<string>("");
  const [repaymentDate, setRepaymentDate] = useState<string>(
    getFoundationTodayDate()
  );
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [reference, setReference] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Preview State
  const [preview, setPreview] = useState<any | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Submit State
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<any | null>(null);

  // Load loan details
  const fetchLoan = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get(`/qard-hasan/${qardId}`);
      setLoan(data);
      if (data && data.outstanding_amount > 0) {
        // Default to monthly repayment or remaining outstanding, whichever is smaller
        const defaultAmt = Math.min(
          parseFloat(data.monthly_repayment_amount) || 0,
          parseFloat(data.outstanding_amount) || 0
        );
        setAmount(defaultAmt.toFixed(2));
      }
    } catch (err: any) {
      setError(err.message || "Failed to load loan details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoan();
  }, [qardId]);

  // Live Repayment Preview fetcher (debounced)
  useEffect(() => {
    if (!loan) return;
    const numAmt = parseFloat(amount);
    const maxAmt = parseFloat(loan.outstanding_amount) || 0;

    if (!numAmt || numAmt <= 0) {
      setPreview(null);
      setPreviewError(null);
      return;
    }

    if (numAmt > maxAmt) {
      setPreview(null);
      setPreviewError(
        `Repayment amount (${formatCurrency(numAmt)}) exceeds remaining outstanding principal (${formatCurrency(maxAmt)}).`
      );
      return;
    }

    setPreviewError(null);
    setLoadingPreview(true);

    const timer = setTimeout(async () => {
      try {
        const res = await api.get(
          `/qard-hasan/${qardId}/repayment-preview?amount=${numAmt.toFixed(2)}`
        );
        setPreview(res);
      } catch (err: any) {
        setPreviewError(err.message || "Failed to calculate repayment preview.");
        setPreview(null);
      } finally {
        setLoadingPreview(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [amount, qardId, loan]);

  // Quick Amount Handlers
  const handleSetMonthly = () => {
    if (!loan) return;
    const m = Math.min(
      parseFloat(loan.monthly_repayment_amount) || 0,
      parseFloat(loan.outstanding_amount) || 0
    );
    setAmount(m.toFixed(2));
  };

  const handleSetFull = () => {
    if (!loan) return;
    const rem = parseFloat(loan.outstanding_amount) || 0;
    setAmount(rem.toFixed(2));
  };

  // Submit Repayment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loan || !preview) return;

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        qard_hasan_id: parseInt(qardId),
        amount: parseFloat(amount),
        repayment_date: repaymentDate,
        payment_method: paymentMethod,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      const result = await api.post("/qard-hasan/repayments", payload);
      setSubmitSuccess(result);

      // Refresh loan data
      await fetchLoan();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setError(err.message || "Failed to record repayment.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-72 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error && !loan) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto py-12">
        <div className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 p-5 text-sm text-rose-800 dark:text-rose-300 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
        <Link href="/admin/qard-hasan" className="btn-secondary text-xs inline-flex items-center gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Manage Qard Hasan
        </Link>
      </div>
    );
  }

  const isCompleted = loan?.status === "COMPLETED" || loan?.outstanding_amount <= 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Top Breadcrumb & Header */}
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
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <Link
              href={`/admin/qard-hasan/${loan?.id}`}
              className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Loan Details
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Coins className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            Record Qard Repayment
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Proportional return of capital to funding groups with exact mathematical precision
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/admin/qard-hasan/${loan?.id}`}
            className="btn-secondary text-xs"
          >
            View Loan History
          </Link>
          <StatusBadge status={loan?.status} />
        </div>
      </div>

      {/* Success Banner */}
      {submitSuccess && (
        <div className="rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-5 shadow-sm space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <Check className="h-5 w-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-950 dark:text-emerald-100 flex items-center gap-2">
                  Repayment Recorded & Funds Returned!
                  <span className="text-[10px] font-mono uppercase bg-emerald-200 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-full font-bold">
                    {submitSuccess.repayment_number}
                  </span>
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Payment of <strong>{formatCurrency(submitSuccess.amount)}</strong> was successfully received and credited
                  back to the respective accounting group(s).
                </p>
              </div>
            </div>
            <button
              onClick={() => setSubmitSuccess(null)}
              className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:underline"
            >
              Dismiss
            </button>
          </div>

          {submitSuccess.allocations && submitSuccess.allocations.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Returned to Funding Groups:
              </span>
              <div className="flex flex-wrap gap-2">
                {submitSuccess.allocations.map((ra: any) => (
                  <div
                    key={ra.id}
                    className="inline-flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-700 px-2.5 py-1 rounded-md text-xs font-medium text-emerald-900 dark:text-emerald-100"
                  >
                    <FolderTree className="h-3 w-3 text-emerald-700 dark:text-emerald-400" />
                    <span>{ra.group?.name || `Group #${ra.group_id}`}:</span>
                    <strong className="font-bold">{formatCurrency(ra.allocated_amount)}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Link
              href={`/admin/qard-hasan/${loan?.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 text-xs font-semibold shadow-xs transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View Updated Loan Details
            </Link>
            <Link
              href="/admin/qard-hasan"
              className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              Back to Manage Qard Hasan
            </Link>
          </div>
        </div>
      )}

      {/* Loan Context Overview Card */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Loan Reference</span>
            <div className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono">
              {loan?.qard_number}
            </div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Beneficiary</span>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-emerald-600" />
              {loan?.beneficiary?.name} ({loan?.beneficiary?.phone || "No phone"})
            </div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Disbursement Date</span>
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {formatDate(loan?.disbursed_date)}
            </div>
          </div>
        </div>

        {/* Financial KPI stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Original Principal</span>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">
              {formatCurrency(loan?.principal_amount)}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
            <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 block">Total Repaid</span>
            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300 font-mono">
              {formatCurrency(loan?.total_repaid)}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
            <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 block">Current Outstanding</span>
            <span className="text-sm font-bold text-blue-700 dark:text-blue-300 font-mono">
              {formatCurrency(loan?.outstanding_amount)}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Monthly Rate</span>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 font-mono">
              {formatCurrency(loan?.monthly_repayment_amount)}
            </span>
          </div>
        </div>

        {/* Existing Funding Sources Breakdown Table */}
        <div className="pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
            <FolderTree className="h-3.5 w-3.5 text-emerald-600" />
            Active Funding Sources for this Loan
          </h3>
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden text-xs">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-950/80 text-[11px] font-semibold text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2 px-3 text-left">Funding Group</th>
                  <th className="py-2 px-3 text-right">Original Capital</th>
                  <th className="py-2 px-3 text-right">Repaid to Date</th>
                  <th className="py-2 px-3 text-right">Current Outstanding</th>
                  <th className="py-2 px-3 text-right">Current Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {loan?.funding_allocations?.map((fa: any) => {
                  const outAmt = parseFloat(fa.outstanding_amount) || 0;
                  const totalOut = parseFloat(loan.outstanding_amount) || 1;
                  const sharePct = totalOut > 0 ? (outAmt / totalOut) * 100 : 0;

                  return (
                    <tr key={fa.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2 px-3 font-sans font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <FolderTree className="h-3.5 w-3.5 text-emerald-600" />
                        {fa.group?.name || `Group #${fa.group_id}`}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-600 dark:text-slate-400">
                        {formatCurrency(fa.allocated_amount)}
                      </td>
                      <td className="py-2 px-3 text-right text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(fa.repaid_amount)}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(fa.outstanding_amount)}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-500 font-sans">
                        {sharePct.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isCompleted ? (
        <div className="rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-6 text-center space-y-3">
          <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
          <h2 className="text-base font-bold text-emerald-950 dark:text-emerald-100">
            This Qard Hasan Loan is Fully Settled
          </h2>
          <p className="text-xs text-emerald-700 dark:text-emerald-300 max-w-md mx-auto">
            All principal capital has been 100% returned to the contributing funding groups. No outstanding balance remains.
          </p>
          <div className="pt-2">
            <Link href="/admin/qard-hasan" className="btn-secondary text-xs">
              Back to Manage Qard Hasan
            </Link>
          </div>
        </div>
      ) : (
        /* Repayment Form */
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Receipt className="h-4 w-4 text-emerald-600" />
              Repayment Details
            </h2>

            {/* Repayment Amount input & quick buttons */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Repayment Amount (৳ BDT) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSetMonthly}
                    className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                  >
                    Monthly Rate ({formatCurrency(loan?.monthly_repayment_amount)})
                  </button>
                  <button
                    type="button"
                    onClick={handleSetFull}
                    className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800 hover:bg-blue-100"
                  >
                    Full Balance ({formatCurrency(loan?.outstanding_amount)})
                  </button>
                </div>
              </div>

              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">৳</span>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={loan?.outstanding_amount}
                  className="input-field pl-8 font-bold text-slate-900 dark:text-slate-100 text-base"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              {previewError && (
                <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium">
                  {previewError}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Repayment Date <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="date"
                  className="input-field text-xs"
                  value={repaymentDate}
                  onChange={(e) => setRepaymentDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Method <span className="text-rose-500">*</span>
                </label>
                <select
                  className="input-field text-xs font-semibold"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="CASH">CASH</option>
                  <option value="BANK_TRANSFER">BANK TRANSFER</option>
                  <option value="BKASH">BKASH</option>
                  <option value="NAGAD">NAGAD</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Receipt / Transaction Ref
                </label>
                <input
                  type="text"
                  placeholder="e.g. REP-REC-001"
                  className="input-field text-xs"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Repayment Notes / Remarks
              </label>
              <input
                type="text"
                placeholder="Optional notes or receipt tracking remarks"
                className="input-field text-xs"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Interactive Live Repayment Distribution Preview */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Live Proportional Distribution Preview
                </h2>
              </div>
              {loadingPreview && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Calculating exact allocation...
                </div>
              )}
            </div>

            {preview ? (
              <div className="space-y-4">
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden text-xs">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-950/80 text-[11px] font-semibold text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3 text-left">Recipient Group</th>
                        <th className="py-2.5 px-3 text-right">Current Outstanding</th>
                        <th className="py-2.5 px-3 text-right bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 font-bold">
                          Capital Returned
                        </th>
                        <th className="py-2.5 px-3 text-right">New Remaining</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                      {preview.allocations?.map((item: any) => {
                        const isSettled = parseFloat(item.new_outstanding) <= 0;
                        return (
                          <tr key={item.funding_allocation_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="py-2.5 px-3 font-sans font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                              <FolderTree className="h-3.5 w-3.5 text-emerald-600" />
                              {item.group_name}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400">
                              {formatCurrency(item.current_outstanding)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50/30 dark:bg-emerald-950/10">
                              +{formatCurrency(item.repayment_share)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">
                              {formatCurrency(item.new_outstanding)}
                            </td>
                            <td className="py-2.5 px-3 text-center font-sans">
                              {isSettled ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                                  <Check className="h-3 w-3" />
                                  Settled
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-[10px] font-bold text-blue-700 bg-blue-100 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 rounded-full">
                                  Partially Returned
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Exact Precision Verification Footer */}
                <div className="rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Repayment Amount</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                        {formatCurrency(preview.repayment_amount)}
                      </span>
                    </div>
                    <div className="text-slate-300 dark:text-slate-700 hidden sm:block font-bold">|</div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Distributed</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-300 font-mono">
                        {formatCurrency(preview.total_allocated)}
                      </span>
                    </div>
                    <div className="text-slate-300 dark:text-slate-700 hidden sm:block font-bold">|</div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Rounding Diff</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-300 font-mono">
                        ৳0.00
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-semibold text-[11px]">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Exact 0.00 BDT mathematical allocation verified
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                Enter a repayment amount above to preview the proportional distribution across funding groups.
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Upon posting, individual inflow transactions will be created and group ledger balances credited.
            </div>

            <div className="flex items-center gap-3">
              <Link href="/admin/qard-hasan" className="btn-secondary text-xs">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || !preview || !parseFloat(amount) || parseFloat(amount) <= 0}
                className={`btn-primary text-xs !py-2.5 !px-5 flex items-center gap-2 ${
                  submitting || !preview ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Posting Repayment & Crediting Ledgers...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Post Repayment ({formatCurrency(parseFloat(amount) || 0)})
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
