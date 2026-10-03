"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  HeartHandshake,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Coins,
  Receipt,
  Calendar,
  Save,
  Tag,
  Phone,
  Mail,
  MapPin,
  FileText,
  User,
  Activity,
  X,
  List
} from "lucide-react";

export default function EditDonorPage() {
  const params = useParams();
  const router = useRouter();
  const donorId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const [donorData, setDonorData] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    donor_number: "",
    phone: "",
    email: "",
    address: "",
    status: "ACTIVE",
    notes: ""
  });

  const fetchDonor = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get(`/donors/${donorId}`);
      setDonorData(data);
      setFormData({
        name: data.name || "",
        donor_number: data.donor_number || "",
        phone: data.phone || "",
        email: data.email || "",
        address: data.address || "",
        status: data.status || "ACTIVE",
        notes: data.notes || ""
      });
    } catch (err: any) {
      setError(err.message || "Failed to load donor profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (donorId) {
      fetchDonor();
    }
  }, [donorId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessBanner(false);

    try {
      const payload: any = {
        name: formData.name.trim(),
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        address: formData.address.trim() || null,
        status: formData.status,
        notes: formData.notes.trim() || null
      };

      if (formData.donor_number.trim()) {
        payload.donor_number = formData.donor_number.trim().toUpperCase();
      }

      const updated = await api.put(`/donors/${donorId}`, payload);
      setDonorData(updated);
      setSuccessBanner(true);
      setShowToast(true);

      setTimeout(() => {
        setShowToast(false);
      }, 5000);
    } catch (err: any) {
      setError(err.message || "Failed to update donor details");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
        <div className="h-28 bg-slate-100 dark:bg-slate-900 rounded-2xl"></div>
        <div className="h-96 bg-slate-100 dark:bg-slate-900 rounded-2xl"></div>
      </div>
    );
  }

  if (error && !donorData) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Link href="/admin/donors" className="btn-secondary text-xs">
          <ArrowLeft className="h-4 w-4" />
          Back to Donors
        </Link>
        <div className="rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/30 p-6 text-rose-800 dark:text-rose-300 space-y-3">
          <div className="flex items-center gap-2 font-bold">
            <AlertCircle className="h-5 w-5 text-rose-600" />
            Unable to Load Donor
          </div>
          <p className="text-xs">{error}</p>
          <button onClick={fetchDonor} className="btn-secondary text-xs">
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-20 right-6 z-50 flex items-start gap-3 bg-emerald-900/95 text-white px-5 py-4 rounded-xl shadow-2xl border border-emerald-500/50 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="h-6 w-6 text-emerald-300 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold text-base text-white">Donor updated successfully</p>
            <p className="text-emerald-100 mt-0.5">
              Changes for <span className="font-semibold text-white">{formData.name}</span> ({formData.donor_number}) are saved in the database.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/donors"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Edit Donor
              </h1>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                {donorData?.donor_number}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Update identification, contact channels, and philanthropy preferences
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/admin/donors/${donorId}`} className="btn-secondary text-xs">
            <Receipt className="h-4 w-4" />
            View Ledger
          </Link>
          <Link href="/admin/donors" className="btn-secondary text-xs">
            <List className="h-4 w-4" />
            Manage Donors
          </Link>
        </div>
      </div>

      {/* Dismissible Inline Success Banner */}
      {successBanner && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-4 text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              <strong>Donor details updated successfully.</strong> All changes have been committed.
            </span>
          </div>
          <button
            onClick={() => setSuccessBanner(false)}
            className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/30 p-4 text-xs sm:text-sm text-rose-800 dark:text-rose-300">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Lifetime Stats Context Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <Coins className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Total Lifetime Donated
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(donorData?.total_donations || 0)}
          </div>
          <span className="text-[11px] text-slate-400">All historical donations</span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <Receipt className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            Donations Count
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            {donorData?.donation_count || 0}
          </div>
          <span className="text-[11px] text-slate-400">Individual donation transactions</span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <Calendar className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            Registered On
          </div>
          <div className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
            {formatDate(donorData?.created_at)}
          </div>
          <span className="text-[11px] text-slate-400 font-mono">ID #{donorData?.id}</span>
        </div>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black p-6 sm:p-8 space-y-6 shadow-sm transition-colors">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Full Name */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Full Name or Organization Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <input
                required
                type="text"
                className="input-field pl-10"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>

          {/* Donor Code */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Donor ID / Code <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <input
                required
                type="text"
                className="input-field pl-10 font-mono uppercase"
                value={formData.donor_number}
                onChange={(e) => setFormData({ ...formData, donor_number: e.target.value.toUpperCase() })}
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Unique identifier used in receipts and ledger records.
            </p>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Status <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Activity className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <select
                required
                className="input-field pl-10"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <input
                type="tel"
                className="input-field pl-10"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <input
                type="email"
                className="input-field pl-10"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          {/* Address */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Mailing / Physical Address
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <input
                type="text"
                className="input-field pl-10"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Background Notes / Preferences
            </label>
            <div className="relative">
              <FileText className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <textarea
                rows={3}
                className="input-field pl-10 pt-2.5"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100 dark:border-slate-800">
          <Link href="/admin/donors" className="btn-secondary text-xs">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary text-xs"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
