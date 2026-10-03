"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { api } from "@/lib/api";
import {
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Copy,
  Check,
  UserPlus,
  ShieldCheck,
  Building
} from "lucide-react";

interface ApplicationStatus {
  request_id: string;
  applicant_name: string;
  group_name: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | string;
  submitted_date: string;
  member_id?: string | null;
  rejection_reason?: string | null;
}

function StatusContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id") || "";

  const [requestId, setRequestId] = useState(initialId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusData, setStatusData] = useState<ApplicationStatus | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchStatus = async (idToSearch: string) => {
    const cleanId = idToSearch.trim().toUpperCase();
    if (!cleanId) {
      setError("Please enter a valid Request ID.");
      return;
    }

    setLoading(true);
    setError(null);
    setStatusData(null);

    try {
      const data = await api.get(`/member-applications/status/${encodeURIComponent(cleanId)}`);
      setStatusData(data);
    } catch (err: any) {
      if (err.status === 404) {
        setError(`No application found for Request ID "${cleanId}". Please check and try again.`);
      } else {
        setError(err.message || "Unable to retrieve application status. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialId) {
      setRequestId(initialId);
      fetchStatus(initialId);
    }
  }, [initialId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStatus(requestId);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full max-w-xl px-4 sm:px-6">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foundation-50 text-foundation-700 dark:bg-foundation-950/60 dark:text-foundation-400 border border-foundation-100 dark:border-foundation-900">
              <Search className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Membership Application Status
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track your public membership application
              </p>
            </div>
          </div>

          <Link
            href="/apply"
            className="text-xs font-semibold text-foundation-700 hover:text-foundation-800 dark:text-foundation-400 hover:underline flex items-center gap-1"
          >
            <UserPlus className="h-3.5 w-3.5" />
            New Application
          </Link>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Request ID <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                required
                type="text"
                placeholder="e.g. REQ-000001"
                className="input-field text-sm font-mono uppercase flex-1"
                value={requestId}
                onChange={(e) => setRequestId(e.target.value)}
              />
              <button
                type="submit"
                disabled={loading || !requestId.trim()}
                className="btn-primary flex items-center gap-2 px-5 text-xs font-bold disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Check Status
              </button>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Enter the Request ID given upon application submission.
            </p>
          </div>
        </form>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Status Result Card */}
        {statusData && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-5 sm:p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Application Status
              </h2>

              {/* Status Badge */}
              {statusData.status === "APPROVED" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  APPROVED
                </span>
              )}
              {statusData.status === "PENDING" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  <Clock className="h-3.5 w-3.5" />
                  PENDING
                </span>
              )}
              {statusData.status === "REJECTED" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                  <XCircle className="h-3.5 w-3.5" />
                  REJECTED
                </span>
              )}
            </div>

            {/* Status-specific Announcement Banner */}
            {statusData.status === "APPROVED" && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/40 p-4 space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  Application Approved
                </div>
                {statusData.member_id && (
                  <div className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-lg p-3 border border-emerald-200/80 dark:border-emerald-800">
                    <div>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Member ID
                      </span>
                      <span className="font-mono text-lg font-black text-emerald-700 dark:text-emerald-400">
                        {statusData.member_id}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(statusData.member_id!, "member_id")}
                      className="btn-secondary !py-1 !px-2.5 text-xs flex items-center gap-1"
                    >
                      {copiedId === "member_id" ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-600 font-semibold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  Welcome to our foundation! Your membership is active and enrolled.
                </p>
              </div>
            )}

            {statusData.status === "PENDING" && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/40 p-4 space-y-1">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm">
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  Application Under Review
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Your membership application is currently being reviewed.
                </p>
              </div>
            )}

            {statusData.status === "REJECTED" && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-900/60 dark:bg-rose-950/40 p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-sm">
                  <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                  Application Rejected
                </div>
                {statusData.rejection_reason && (
                  <p className="text-xs text-rose-700 dark:text-rose-300 bg-white/70 dark:bg-slate-900/70 p-2.5 rounded-lg border border-rose-200/60 dark:border-rose-900/40">
                    <span className="font-semibold">Reason:</span> {statusData.rejection_reason}
                  </p>
                )}
              </div>
            )}

            {/* Application Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="rounded-lg bg-white dark:bg-slate-900 p-3.5 border border-slate-200/70 dark:border-slate-800">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Request ID
                </span>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200">
                    {statusData.request_id}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(statusData.request_id, "request_id")}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                    title="Copy Request ID"
                  >
                    {copiedId === "request_id" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="rounded-lg bg-white dark:bg-slate-900 p-3.5 border border-slate-200/70 dark:border-slate-800">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Applicant
                </span>
                <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 block mt-0.5">
                  {statusData.applicant_name}
                </span>
              </div>

              <div className="rounded-lg bg-white dark:bg-slate-900 p-3.5 border border-slate-200/70 dark:border-slate-800">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Group
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Building className="h-3.5 w-3.5 text-foundation-600 shrink-0" />
                  <span className="font-medium text-sm text-slate-800 dark:text-slate-200 truncate">
                    {statusData.group_name}
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-white dark:bg-slate-900 p-3.5 border border-slate-200/70 dark:border-slate-800">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Submitted
                </span>
                <span className="font-medium text-sm text-slate-800 dark:text-slate-200 block mt-0.5">
                  {statusData.submitted_date || "—"}
                </span>
              </div>
            </div>

            {/* Privacy notice */}
            <div className="pt-2 text-center border-t border-slate-200/60 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                Public Safe Status Record • Private personal information is protected
              </span>
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <Link
            href="/"
            className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1.5 font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Home
          </Link>
          <Link
            href="/apply"
            className="text-xs font-semibold text-foundation-700 hover:text-foundation-800 dark:text-foundation-400"
          >
            Apply to Join Foundation
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ApplicationStatusPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-12 sm:py-16">
        <Suspense
          fallback={
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-foundation-700" />
            </div>
          }
        >
          <StatusContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
