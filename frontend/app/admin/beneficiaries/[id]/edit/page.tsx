"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useFlash, getUserFriendlyErrorMessage } from "@/lib/flash";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  HandHeart,
  Save,
  X,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FileText,
  ExternalLink,
  Scale,
  HeartHandshake
} from "lucide-react";

export default function EditBeneficiaryPage() {
  const params = useParams();
  const router = useRouter();
  const { flash } = useFlash();

  const beneficiaryId = params?.id ? String(params.id) : "";

  // Data loading state
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Beneficiary reference
  const [beneficiary, setBeneficiary] = useState<any | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    phone: "",
    email: "",
    address: "",
    nid_or_id: "",
    status: "ACTIVE",
    notes: "",
  });

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [inlineSuccess, setInlineSuccess] = useState<string | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);

  // Load Beneficiary Data
  const loadBeneficiary = async () => {
    if (!beneficiaryId) return;
    setLoading(true);
    setFetchError(null);
    setNotFound(false);

    try {
      const data = await api.get(`/beneficiaries/${beneficiaryId}`);
      setBeneficiary(data);
      setFormData({
        code: data.code || data.beneficiary_number || "",
        name: data.name || "",
        phone: data.phone || "",
        email: data.email || "",
        address: data.address || "",
        nid_or_id: data.nid_or_id || "",
        status: data.status || "ACTIVE",
        notes: data.notes || "",
      });
    } catch (err: any) {
      if (err.status === 404 || err.message?.includes("not found")) {
        setNotFound(true);
      } else {
        setFetchError(getUserFriendlyErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBeneficiary();
  }, [beneficiaryId]);

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanName = formData.name.trim();
    if (!cleanName) {
      setInlineError("Beneficiary Name is required.");
      flash.warning("Missing Name", "Please enter beneficiary's full name.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const cleanPhone = formData.phone.trim();
    if (!cleanPhone) {
      setInlineError("Contact Phone is required.");
      flash.warning("Missing Phone", "Please enter contact telephone number.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitting(true);
    setInlineError(null);
    setInlineSuccess(null);

    try {
      const payload: any = {
        name: cleanName,
        phone: cleanPhone,
        status: formData.status || "ACTIVE",
      };

      if (formData.code.trim()) {
        payload.code = formData.code.trim().toUpperCase();
        payload.beneficiary_number = payload.code;
      }

      payload.email = formData.email.trim() ? formData.email.trim() : undefined;
      payload.address = formData.address.trim() ? formData.address.trim() : undefined;
      payload.nid_or_id = formData.nid_or_id.trim() ? formData.nid_or_id.trim() : undefined;
      payload.notes = formData.notes.trim() ? formData.notes.trim() : undefined;

      const updated = await api.put(`/beneficiaries/${beneficiaryId}`, payload);
      setBeneficiary(updated);

      flash.success("Beneficiary updated successfully", `Beneficiary record for "${updated.name}" [${updated.code || updated.beneficiary_number}] has been saved to the database.`);
      setInlineSuccess("Beneficiary updated successfully");
      window.scrollTo({ top: 0, behavior: "smooth" });

      setTimeout(() => {
        setInlineSuccess(null);
      }, 5000);
    } catch (err: any) {
      const msg = getUserFriendlyErrorMessage(err);
      setInlineError(msg);
      flash.error("Unable to update beneficiary", msg);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  };

  // Loading Skeleton State
  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto pb-12">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            <div className="h-4 w-72 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xs flex flex-col items-center justify-center min-h-[320px]">
          <Loader2 className="h-9 w-9 animate-spin text-emerald-600 mb-3" />
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Loading beneficiary profile and aid disbursement records...
          </span>
        </div>
      </div>
    );
  }

  // 404 Not Found State
  if (notFound) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto py-12">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xs text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Beneficiary not found</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            The requested beneficiary profile (ID: {beneficiaryId}) does not exist in the database.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/admin/beneficiaries"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors shadow-xs"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to Manage Beneficiaries
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (fetchError) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto py-12">
        <div className="rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 p-8 shadow-xs text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-rose-600 dark:text-rose-400 mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Unable to Load Beneficiary</h2>
          <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">{fetchError}</p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={loadBeneficiary}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 transition-colors shadow-xs"
            >
              Retry Loading
            </button>
            <Link
              href="/admin/beneficiaries"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Manage Beneficiaries
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header with Back, Title, and Action Links */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/beneficiaries"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
            title="Return to Manage Beneficiaries"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Edit Beneficiary
              </h1>
              {beneficiary && (
                <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {beneficiary.code || beneficiary.beneficiary_number}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Update welfare recipient profile, contact numbers, address, and case documentation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {beneficiary && (
            <Link
              href={`/admin/beneficiaries/${beneficiary.id}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
            >
              <ExternalLink className="h-4 w-4 text-slate-400" />
              Beneficiary Profile
            </Link>
          )}
          <Link
            href="/admin/beneficiaries"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
          >
            Cancel
          </Link>
        </div>
      </div>

      {/* Dismissible Inline Success Banner */}
      {inlineSuccess && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30 p-4 text-sm text-emerald-800 dark:text-emerald-300 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold">{inlineSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setInlineSuccess(null)}
            className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Dismissible Inline Error Banner */}
      {inlineError && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 p-4 text-sm text-rose-800 dark:text-rose-300 shadow-xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{inlineError}</span>
          </div>
          <button
            type="button"
            onClick={() => setInlineError(null)}
            className="text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Historical Aid Snapshot Cards */}
      {beneficiary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 shadow-xs dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Total Qard Hasan Received
            </div>
            <div className="mt-1 text-xl font-bold text-emerald-700 dark:text-emerald-400">
              {formatCurrency(beneficiary.total_qard_received || 0)}
            </div>
            <div className="text-[11px] text-emerald-600/80 dark:text-emerald-400/70 mt-0.5">
              Interest-free loan disbursements
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 shadow-xs dark:border-blue-900/40 dark:bg-blue-950/20">
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              Total Qard Repaid
            </div>
            <div className="mt-1 text-xl font-bold text-blue-700 dark:text-blue-400">
              {formatCurrency(beneficiary.total_qard_repaid || 0)}
            </div>
            <div className="text-[11px] text-blue-600/80 dark:text-blue-400/70 mt-0.5">
              Outstanding: {formatCurrency(beneficiary.total_qard_outstanding || 0)}
            </div>
          </div>

          <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-4 shadow-xs dark:border-purple-900/40 dark:bg-purple-950/20">
            <div className="text-xs font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-400">
              Sadakah Grants Received
            </div>
            <div className="mt-1 text-xl font-bold text-purple-700 dark:text-purple-400">
              {formatCurrency(beneficiary.total_sadakah_received || 0)}
            </div>
            <div className="text-[11px] text-purple-600/80 dark:text-purple-400/70 mt-0.5">
              Non-repayable charity grants
            </div>
          </div>
        </div>
      )}

      {/* Main Edit Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs transition-colors">
          <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <HandHeart className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Beneficiary Profile Information
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Beneficiary Name (Required) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Beneficiary Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full name of beneficiary"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Beneficiary Code */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Beneficiary Code / Number
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. BEN-0001"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Identifier used in Qard Hasan disbursements and Sadakah grant vouchers.
              </p>
            </div>

            {/* Contact Phone (Required) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Contact Phone <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+880 1711-000000"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="beneficiary@domain.com"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* NID / Identification */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                NID / Identification Number
              </label>
              <input
                type="text"
                value={formData.nid_or_id}
                onChange={(e) => setFormData({ ...formData, nid_or_id: e.target.value })}
                placeholder="e.g. 19901234567890"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="ACTIVE">ACTIVE — Eligible for Aid & Loans</option>
                <option value="INACTIVE">INACTIVE — Temporary Hold</option>
                <option value="ARCHIVED">ARCHIVED — Closed Record</option>
              </select>
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Residential / Present Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Village / Road / Thana / District"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Notes / Case Background */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Welfare Case Notes & Verification Details
              </label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Document financial background, family dependents, verification committee notes, or specific relief requirements..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="sticky bottom-4 z-20 flex items-center justify-between gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 shadow-lg">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Editing Beneficiary <span className="font-semibold text-slate-700 dark:text-slate-200">{beneficiary?.name}</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/beneficiaries"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
