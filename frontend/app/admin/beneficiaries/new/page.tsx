"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useFlash } from "@/lib/flash";
import {
  HandHeart,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RotateCcw,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  FileText,
  CreditCard,
  User,
  ShieldCheck,
  Building
} from "lucide-react";

export default function AddBeneficiaryPage() {
  const router = useRouter();
  const { flash } = useFlash();

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

  const [submitting, setSubmitting] = useState(false);
  const [recentBeneficiary, setRecentBeneficiary] = useState<any | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFormData({
      code: "",
      name: "",
      phone: "",
      email: "",
      address: "",
      nid_or_id: "",
      status: "ACTIVE",
      notes: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      flash.warning("Missing Name", "Beneficiary name is required.");
      return;
    }

    if (!formData.phone.trim()) {
      flash.warning("Missing Phone", "Beneficiary contact phone number is required.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        status: formData.status,
      };

      if (formData.code.trim()) {
        payload.code = formData.code.trim().toUpperCase();
        payload.beneficiary_number = payload.code;
      }
      if (formData.email.trim()) payload.email = formData.email.trim();
      if (formData.address.trim()) payload.address = formData.address.trim();
      if (formData.nid_or_id.trim()) payload.nid_or_id = formData.nid_or_id.trim();
      if (formData.notes.trim()) payload.notes = formData.notes.trim();

      const created = await api.post("/beneficiaries", payload);

      const assignedCode = created.code || created.beneficiary_number || "B-####";

      flash.success(
        "Beneficiary Registered Successfully",
        `Beneficiary "${created.name}" assigned code ${assignedCode} has been registered successfully.`
      );

      setRecentBeneficiary({
        id: created.id,
        name: created.name,
        code: assignedCode,
        phone: created.phone,
        status: created.status,
        timestamp: new Date().toLocaleTimeString(),
      });

      // Reset form fields for immediate next entry
      handleReset();
    } catch (err: any) {
      console.error("Failed to create beneficiary", err);
      const detail = err.response?.data?.detail || err.message || "Failed to register beneficiary";
      flash.error("Registration Failed", detail);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
            <Link
              href="/admin/beneficiaries"
              className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Manage Beneficiaries
            </Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-gray-100 font-medium">Add Beneficiary</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <HandHeart className="w-7 h-7 text-primary-600 dark:text-primary-400" />
            Add New Beneficiary
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Register a beneficiary to become eligible for interest-free Qard Hasan loans and non-repayable Sadakah welfare grants.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear Form
          </button>
          <Link
            href="/admin/beneficiaries"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors shadow-sm"
          >
            Manage Beneficiaries
          </Link>
        </div>
      </div>

      {/* Success Notification Banner / Recent Beneficiary Card */}
      {recentBeneficiary && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-5 shadow-sm transition-all animate-fadeIn">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/60 rounded-lg text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                  Beneficiary Added Successfully!
                </h3>
                <p className="text-sm text-emerald-800 dark:text-emerald-300 mt-0.5">
                  Beneficiary <strong className="font-semibold">{recentBeneficiary.name}</strong> has been enrolled with ID <strong className="font-mono">{recentBeneficiary.code}</strong> at {recentBeneficiary.timestamp}.
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <Link
                    href={`/admin/beneficiaries/${recentBeneficiary.id}`}
                    className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 underline hover:text-emerald-900"
                  >
                    View Beneficiary Profile &rarr;
                  </Link>
                  <Link
                    href="/admin/beneficiaries/ledger"
                    className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 underline hover:text-emerald-900"
                  >
                    View Assistance Ledger &rarr;
                  </Link>
                </div>
              </div>
            </div>
            <button
              onClick={() => setRecentBeneficiary(null)}
              className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 text-xs font-semibold px-2 py-1 rounded"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Add Beneficiary Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Beneficiary Code */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
              Beneficiary Code / Number
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs font-mono font-bold text-gray-400">#</span>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="Leave blank for auto-generation (e.g. B-0001)"
                className="w-full pl-8 pr-3.5 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all uppercase placeholder:normal-case placeholder:text-gray-400"
              />
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
              Leave blank to auto-generate next sequence (e.g. B-0001, B-0002) or specify a custom unique code.
            </p>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            >
              <option value="ACTIVE">ACTIVE (Eligible for Qard Hasan &amp; Sadakah)</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          {/* Full Name */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g. Mohammad Harun or Fatima Begum"
                className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="e.g. 01711223344"
                className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
              Email Address (Optional)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. beneficiary@example.com"
                className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* NID / Identification */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
              National ID / Passport / Identification
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                name="nid_or_id"
                value={formData.nid_or_id}
                onChange={handleChange}
                placeholder="e.g. 19901234567890"
                className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
              Present Address / Village
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="e.g. House 12, Road 4, Sector 7, Uttara, Dhaka"
                className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
              Background Notes / Circumstances
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Record details regarding household situation, eligibility, or family background..."
              className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
          <Link
            href="/admin/beneficiaries"
            className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/60 rounded-xl transition-colors text-center"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow transition-all"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Registering Beneficiary...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Register Beneficiary
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
