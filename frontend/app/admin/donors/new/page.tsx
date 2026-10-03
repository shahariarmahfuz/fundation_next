"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  HeartHandshake,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  PlusCircle,
  List,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  FileText,
  Tag,
  User,
  Activity
} from "lucide-react";

export default function AddDonorPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    donor_number: "",
    phone: "",
    email: "",
    address: "",
    status: "ACTIVE",
    notes: ""
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdDonor, setCreatedDonor] = useState<any | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

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

      const res = await api.post("/donors", payload);
      setCreatedDonor(res);
      setShowSuccessToast(true);

      // Auto-hide toast after 8 seconds
      setTimeout(() => {
        setShowSuccessToast(false);
      }, 8000);
    } catch (err: any) {
      setError(err.message || "Failed to create donor. Please verify all details.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForAnother = () => {
    setFormData({
      name: "",
      donor_number: "",
      phone: "",
      email: "",
      address: "",
      status: "ACTIVE",
      notes: ""
    });
    setCreatedDonor(null);
    setShowSuccessToast(false);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Toast Notification */}
      {showSuccessToast && createdDonor && (
        <div className="fixed top-20 right-6 z-50 flex items-start gap-3 bg-emerald-900/95 text-white px-5 py-4 rounded-xl shadow-2xl border border-emerald-500/50 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="h-6 w-6 text-emerald-300 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold text-base text-white">Donor added successfully</p>
            <p className="text-emerald-100 mt-0.5">
              Donor ID: <span className="font-mono font-bold text-white bg-emerald-800/80 px-2 py-0.5 rounded">{createdDonor.donor_number}</span> — {createdDonor.name}
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
                Add New Donor
              </h1>
              <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <Sparkles className="h-3 w-3" />
                Dedicated Form
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Register a philanthropic supporter or partner organization for official contribution records
            </p>
          </div>
        </div>

        <Link href="/admin/donors" className="btn-secondary text-xs">
          <List className="h-4 w-4" />
          Manage Donors
        </Link>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 dark:border-rose-800/80 bg-rose-50 dark:bg-rose-950/40 p-4 text-xs sm:text-sm text-rose-800 dark:text-rose-300 animate-in fade-in">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Persistent Inline Success Card */}
      {createdDonor && (
        <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-6 space-y-4 animate-in fade-in">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                ✓ Donor Added Successfully
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                The donor has been saved to the database and can now be selected when recording donations.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/60 text-xs">
            <div>
              <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                Donor ID / Code
              </span>
              <p className="text-sm font-mono font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                {createdDonor.donor_number}
              </p>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                Donor Name
              </span>
              <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                {createdDonor.name}
              </p>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                Initial Status
              </span>
              <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                  {createdDonor.status}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleResetForAnother}
              className="btn-primary text-xs"
            >
              <PlusCircle className="h-4 w-4" />
              Add Another Donor
            </button>
            <Link
              href="/admin/donations/new"
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 text-xs font-semibold transition-colors"
            >
              <HeartHandshake className="h-4 w-4" />
              Record Donation for this Donor
            </Link>
            <Link href="/admin/donors" className="btn-secondary text-xs">
              <List className="h-4 w-4" />
              Manage Donors
            </Link>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black p-6 sm:p-8 space-y-6 shadow-sm transition-colors">
        <div className="space-y-1 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HeartHandshake className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Donor Identification & Contact Details
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Please fill in the donor details. Only the Full Name is required; donor code will be auto-generated if left blank.
          </p>
        </div>

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
                placeholder="e.g. Haji Nurul Islam or Al-Barakah Foundation"
                className="input-field pl-10"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>

          {/* Donor Code */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Donor ID / Code (Optional)
            </label>
            <div className="relative">
              <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="e.g. DNR-0001 (Leave empty to auto-generate)"
                className="input-field pl-10 font-mono uppercase"
                value={formData.donor_number}
                onChange={(e) => setFormData({ ...formData, donor_number: e.target.value.toUpperCase() })}
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
              Unique identifier. If left empty, system automatically assigns the next available sequence code.
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
                placeholder="e.g. +880 1711 000000"
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
                placeholder="e.g. donor@example.com"
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
                placeholder="e.g. House 42, Road 7, Dhanmondi, Dhaka"
                className="input-field pl-10"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Background Notes / Philanthropic Focus
            </label>
            <div className="relative">
              <FileText className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <textarea
                rows={3}
                placeholder="Optional notes regarding donor background, specific causes supported, or preferred contact times..."
                className="input-field pl-10 pt-2.5"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100 dark:border-slate-800">
          <Link href="/admin/donors" className="btn-secondary text-xs">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary text-xs"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Save & Add Donor
          </button>
        </div>
      </form>
    </div>
  );
}
