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
  User,
  Users,
  Phone,
  MapPin,
  Home,
  FileText,
  CreditCard,
  Camera,
  PenTool,
  UploadCloud,
  Trash2,
  Tag,
  ShieldCheck,
  HeartHandshake
} from "lucide-react";

export default function AddBeneficiaryPage() {
  const router = useRouter();
  const { flash } = useFlash();

  const [formData, setFormData] = useState({
    code: "",
    status: "ACTIVE",

    // Personal Information
    name: "", // Strictly only this is required
    father_or_husband_name: "",
    nid_or_id: "",
    phone: "",
    present_address: "",
    permanent_address: "",

    // Emergency Contact
    emergency_contact_name: "",
    emergency_contact_relation: "",
    emergency_contact_phone: "",

    // Documents
    photo_url: "",
    signature_url: "",
    id_document_type: "NID",
    nid_front_url: "",
    nid_back_url: "",

    // Notes
    notes: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [recentBeneficiary, setRecentBeneficiary] = useState<any | null>(null);
  const [uploadingState, setUploadingState] = useState<Record<string, boolean>>({});
  const [uploadError, setUploadError] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFormData({
      code: "",
      status: "ACTIVE",
      name: "",
      father_or_husband_name: "",
      nid_or_id: "",
      phone: "",
      present_address: "",
      permanent_address: "",
      emergency_contact_name: "",
      emergency_contact_relation: "",
      emergency_contact_phone: "",
      photo_url: "",
      signature_url: "",
      id_document_type: "NID",
      nid_front_url: "",
      nid_back_url: "",
      notes: "",
    });
    setUploadError({});
  };

  const handleFileUpload = async (file: File, category: string) => {
    setUploadingState((prev) => ({ ...prev, [category]: true }));
    setUploadError((prev) => ({ ...prev, [category]: "" }));

    const fd = new FormData();
    fd.append("file", file);
    fd.append("category", category);

    try {
      // First attempt dedicated beneficiaries upload, fallback to members upload-temp if needed
      let res: any;
      try {
        res = await api.upload<{ secure_url: string; public_id: string }>(
          "/beneficiaries/upload-temp",
          fd
        );
      } catch (e: any) {
        res = await api.upload<{ secure_url: string; public_id: string }>(
          "/members/upload-temp",
          fd
        );
      }

      if (category === "PHOTO") {
        setFormData((prev) => ({ ...prev, photo_url: res.secure_url }));
      } else if (category === "SIGNATURE") {
        setFormData((prev) => ({ ...prev, signature_url: res.secure_url }));
      } else if (category === "NID_FRONT") {
        setFormData((prev) => ({ ...prev, nid_front_url: res.secure_url }));
      } else if (category === "NID_BACK") {
        setFormData((prev) => ({ ...prev, nid_back_url: res.secure_url }));
      } else if (category === "BIRTH_CERTIFICATE") {
        setFormData((prev) => ({ ...prev, nid_front_url: res.secure_url }));
      }
    } catch (err: any) {
      setUploadError((prev) => ({
        ...prev,
        [category]: err.message || "Failed to upload file to Cloudinary.",
      }));
    } finally {
      setUploadingState((prev) => ({ ...prev, [category]: false }));
    }
  };

  const handleFileRemove = (category: string) => {
    if (category === "PHOTO") {
      setFormData((prev) => ({ ...prev, photo_url: "" }));
    } else if (category === "SIGNATURE") {
      setFormData((prev) => ({ ...prev, signature_url: "" }));
    } else if (category === "NID_FRONT") {
      setFormData((prev) => ({ ...prev, nid_front_url: "" }));
    } else if (category === "NID_BACK") {
      setFormData((prev) => ({ ...prev, nid_back_url: "" }));
    } else if (category === "BIRTH_CERTIFICATE") {
      setFormData((prev) => ({ ...prev, nid_front_url: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // STRICTLY ONLY FULL NAME IS REQUIRED
    if (!formData.name.trim()) {
      flash.warning("Missing Name", "Beneficiary full name is required.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        name: formData.name.trim(),
        status: formData.status || "ACTIVE",
      };

      if (formData.code.trim()) {
        payload.code = formData.code.trim().toUpperCase();
        payload.beneficiary_number = payload.code;
      }

      // Personal Information (all optional)
      if (formData.father_or_husband_name.trim()) {
        payload.father_or_husband_name = formData.father_or_husband_name.trim();
      }
      if (formData.nid_or_id.trim()) {
        payload.nid_or_id = formData.nid_or_id.trim();
      }
      if (formData.phone.trim()) {
        payload.phone = formData.phone.trim();
      }
      if (formData.present_address.trim()) {
        payload.present_address = formData.present_address.trim();
        payload.address = formData.present_address.trim();
      }
      if (formData.permanent_address.trim()) {
        payload.permanent_address = formData.permanent_address.trim();
      }

      // Emergency Contact (all optional)
      if (formData.emergency_contact_name.trim()) {
        payload.emergency_contact_name = formData.emergency_contact_name.trim();
      }
      if (formData.emergency_contact_relation.trim()) {
        payload.emergency_contact_relation = formData.emergency_contact_relation.trim();
      }
      if (formData.emergency_contact_phone.trim()) {
        payload.emergency_contact_phone = formData.emergency_contact_phone.trim();
      }

      // Documents (all optional)
      if (formData.photo_url.trim()) {
        payload.photo_url = formData.photo_url.trim();
      }
      if (formData.signature_url.trim()) {
        payload.signature_url = formData.signature_url.trim();
      }
      if (formData.id_document_type) {
        payload.id_document_type = formData.id_document_type;
      }
      if (formData.nid_front_url.trim()) {
        payload.nid_front_url = formData.nid_front_url.trim();
      }
      if (formData.nid_back_url.trim()) {
        payload.nid_back_url = formData.nid_back_url.trim();
      }

      // Notes (optional)
      if (formData.notes.trim()) {
        payload.notes = formData.notes.trim();
      }

      const created = await api.post("/beneficiaries", payload);
      const assignedCode = created.code || created.beneficiary_number || "B-####";

      flash.success(
        "Beneficiary Registered Successfully",
        `Beneficiary "${created.name}" assigned code ${assignedCode} has been registered.`
      );

      setRecentBeneficiary({
        id: created.id,
        name: created.name,
        code: assignedCode,
        phone: created.phone || "—",
        status: created.status,
        timestamp: new Date().toLocaleTimeString(),
      });

      handleReset();
      window.scrollTo({ top: 0, behavior: "smooth" });
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
            <Link
              href="/admin/beneficiaries"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Manage Beneficiaries
            </Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-slate-100 font-medium">Add Beneficiary</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <HandHeart className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            Add New Beneficiary
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Register a beneficiary for Qard Hasan loans and Sadakah welfare grants. Only Full Name is required.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear Form
          </button>
          <Link
            href="/admin/beneficiaries"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
          >
            Manage Beneficiaries
          </Link>
        </div>
      </div>

      {/* Success Notification Banner / Recent Beneficiary Card */}
      {recentBeneficiary && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 shadow-xs transition-all animate-fadeIn">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/60 rounded-xl text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                  Beneficiary Added Successfully!
                </h3>
                <p className="text-sm text-emerald-800 dark:text-emerald-300 mt-0.5">
                  Beneficiary <strong className="font-semibold">{recentBeneficiary.name}</strong> has been enrolled with ID <strong className="font-mono">{recentBeneficiary.code}</strong> at {recentBeneficiary.timestamp}.
                </p>
                <div className="mt-3 flex items-center gap-4">
                  <Link
                    href={`/admin/beneficiaries/${recentBeneficiary.id}`}
                    className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline"
                  >
                    View Beneficiary Profile &rarr;
                  </Link>
                  <Link
                    href="/admin/qard-hasan/new"
                    className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline"
                  >
                    Disburse Qard Hasan &rarr;
                  </Link>
                  <Link
                    href="/admin/sadaqah/new"
                    className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline"
                  >
                    Disburse Sadakah Aid &rarr;
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

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* System Settings & Identifiers */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Beneficiary Code */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Beneficiary Code / Number (Optional)
              </label>
              <div className="relative">
                <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="Leave blank for auto-generation (e.g. B-0001)"
                  className="input-field pl-10 font-mono uppercase placeholder:normal-case"
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Auto-assigned sequentially if left blank.
              </p>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <div className="relative">
                <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="input-field pl-10"
                >
                  <option value="ACTIVE">ACTIVE (Eligible for Aid &amp; Loans)</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 1: Personal Information */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-5 shadow-xs">
          <div className="border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Personal Information
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Only Full Name is required. All other personal fields are optional.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Full Name * (REQUIRED) */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Mohammad Harun or Fatima Begum"
                  className="input-field pl-10 font-medium"
                />
              </div>
            </div>

            {/* Father/Husband's Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Father / Husband&apos;s Name (Optional)
              </label>
              <div className="relative">
                <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  name="father_or_husband_name"
                  value={formData.father_or_husband_name}
                  onChange={handleChange}
                  placeholder="e.g. Abdul Karim"
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* National ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                National ID / Passport (Optional)
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  name="nid_or_id"
                  value={formData.nid_or_id}
                  onChange={handleChange}
                  placeholder="e.g. 19901234567890"
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Mobile */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Mobile Number (Optional)
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. 01711223344"
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Present Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Present Address (Optional)
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  name="present_address"
                  value={formData.present_address}
                  onChange={handleChange}
                  placeholder="e.g. House 12, Road 4, Sector 7, Uttara, Dhaka"
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Permanent Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Permanent Address (Optional)
              </label>
              <div className="relative">
                <Home className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  name="permanent_address"
                  value={formData.permanent_address}
                  onChange={handleChange}
                  placeholder="e.g. Village, Post Office, Upazila, District"
                  className="input-field pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Emergency Contact */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-5 shadow-xs">
          <div className="border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Phone className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Emergency Contact (Optional)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Details of a next of kin or emergency contact person. All fields are optional.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Emergency Contact Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Name (Optional)
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  name="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={handleChange}
                  placeholder="e.g. Rohim Uddin"
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Relation */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Relation (Optional)
              </label>
              <div className="relative">
                <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  name="emergency_contact_relation"
                  value={formData.emergency_contact_relation}
                  onChange={handleChange}
                  placeholder="e.g. Brother, Son, Spouse"
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Mobile (Optional)
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <input
                  type="tel"
                  name="emergency_contact_phone"
                  value={formData.emergency_contact_phone}
                  onChange={handleChange}
                  placeholder="e.g. 01811223344"
                  className="input-field pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: Documents */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Documents &amp; Verification (Optional)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Attach optional documents, photographs, signatures, or identification proofs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Beneficiary Photo */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Beneficiary Photo (Optional)
              </label>
              {formData.photo_url ? (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                  <img
                    src={formData.photo_url}
                    alt="Beneficiary Photo"
                    className="h-14 w-14 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-900 dark:text-white truncate">Photo Attached</p>
                    <a
                      href={formData.photo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      View Full Image
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleFileRemove("PHOTO")}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-5 text-center hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingState["PHOTO"]}
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "PHOTO")}
                  />
                  {uploadingState["PHOTO"] ? (
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mb-1" />
                  ) : (
                    <Camera className="h-6 w-6 text-slate-400 dark:text-slate-500 mb-1" />
                  )}
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {uploadingState["PHOTO"] ? "Uploading Photo..." : "Upload Beneficiary Photo"}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, WEBP (Max 5MB)</span>
                </label>
              )}
              {uploadError["PHOTO"] && (
                <p className="text-xs text-rose-600 mt-1">{uploadError["PHOTO"]}</p>
              )}
            </div>

            {/* Signature */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Signature (Optional)
              </label>
              {formData.signature_url ? (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                  <img
                    src={formData.signature_url}
                    alt="Signature"
                    className="h-14 w-28 object-contain bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-1"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-900 dark:text-white truncate">Signature Attached</p>
                    <a
                      href={formData.signature_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      View Full Image
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleFileRemove("SIGNATURE")}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-5 text-center hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingState["SIGNATURE"]}
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "SIGNATURE")}
                  />
                  {uploadingState["SIGNATURE"] ? (
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mb-1" />
                  ) : (
                    <PenTool className="h-6 w-6 text-slate-400 dark:text-slate-500 mb-1" />
                  )}
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {uploadingState["SIGNATURE"] ? "Uploading Signature..." : "Upload Signature"}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, WEBP (Max 2MB)</span>
                </label>
              )}
              {uploadError["SIGNATURE"] && (
                <p className="text-xs text-rose-600 mt-1">{uploadError["SIGNATURE"]}</p>
              )}
            </div>
          </div>

          {/* ID Document Type */}
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                ID Document Type (Optional)
              </label>
              <div className="flex gap-6">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="id_document_type"
                    value="NID"
                    checked={formData.id_document_type === "NID"}
                    onChange={() => setFormData({ ...formData, id_document_type: "NID" })}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">National ID (NID)</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="id_document_type"
                    value="Birth Certificate"
                    checked={formData.id_document_type === "Birth Certificate"}
                    onChange={() => setFormData({ ...formData, id_document_type: "Birth Certificate" })}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Birth Certificate</span>
                </label>
              </div>
            </div>

            {/* NID Front & Back */}
            {formData.id_document_type === "NID" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                {/* NID Front */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    NID Front (Optional)
                  </label>
                  {formData.nid_front_url ? (
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                      <img
                        src={formData.nid_front_url}
                        alt="NID Front"
                        className="h-12 w-20 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-900 dark:text-white truncate">NID Front Attached</p>
                        <a
                          href={formData.nid_front_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          View Full Document
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFileRemove("NID_FRONT")}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-5 text-center hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <input
                        type="file"
                        className="hidden"
                        disabled={uploadingState["NID_FRONT"]}
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "NID_FRONT")}
                      />
                      {uploadingState["NID_FRONT"] ? (
                        <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mb-1" />
                      ) : (
                        <UploadCloud className="h-6 w-6 text-slate-400 dark:text-slate-500 mb-1" />
                      )}
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {uploadingState["NID_FRONT"] ? "Uploading NID Front..." : "Upload NID Front"}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, PDF (Max 10MB)</span>
                    </label>
                  )}
                  {uploadError["NID_FRONT"] && (
                    <p className="text-xs text-rose-600 mt-1">{uploadError["NID_FRONT"]}</p>
                  )}
                </div>

                {/* NID Back */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    NID Back (Optional)
                  </label>
                  {formData.nid_back_url ? (
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                      <img
                        src={formData.nid_back_url}
                        alt="NID Back"
                        className="h-12 w-20 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-900 dark:text-white truncate">NID Back Attached</p>
                        <a
                          href={formData.nid_back_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          View Full Document
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFileRemove("NID_BACK")}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-5 text-center hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <input
                        type="file"
                        className="hidden"
                        disabled={uploadingState["NID_BACK"]}
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "NID_BACK")}
                      />
                      {uploadingState["NID_BACK"] ? (
                        <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mb-1" />
                      ) : (
                        <UploadCloud className="h-6 w-6 text-slate-400 dark:text-slate-500 mb-1" />
                      )}
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {uploadingState["NID_BACK"] ? "Uploading NID Back..." : "Upload NID Back"}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, PDF (Max 10MB)</span>
                    </label>
                  )}
                  {uploadError["NID_BACK"] && (
                    <p className="text-xs text-rose-600 mt-1">{uploadError["NID_BACK"]}</p>
                  )}
                </div>
              </div>
            )}

            {/* Birth Certificate */}
            {formData.id_document_type === "Birth Certificate" && (
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Birth Certificate Document (Optional)
                </label>
                {formData.nid_front_url ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                    <img
                      src={formData.nid_front_url}
                      alt="Birth Certificate"
                      className="h-12 w-20 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-900 dark:text-white truncate">Birth Certificate Attached</p>
                      <a
                        href={formData.nid_front_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        View Full Document
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleFileRemove("BIRTH_CERTIFICATE")}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-5 text-center hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <input
                      type="file"
                      className="hidden"
                      disabled={uploadingState["BIRTH_CERTIFICATE"]}
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "BIRTH_CERTIFICATE")}
                    />
                    {uploadingState["BIRTH_CERTIFICATE"] ? (
                      <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mb-1" />
                    ) : (
                      <UploadCloud className="h-6 w-6 text-slate-400 dark:text-slate-500 mb-1" />
                    )}
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {uploadingState["BIRTH_CERTIFICATE"] ? "Uploading Document..." : "Upload Birth Certificate"}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, PDF (Max 10MB)</span>
                  </label>
                )}
                {uploadError["BIRTH_CERTIFICATE"] && (
                  <p className="text-xs text-rose-600 mt-1">{uploadError["BIRTH_CERTIFICATE"]}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* SECTION 4: Background Notes */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-4 shadow-xs">
          <div className="border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Background Notes / Circumstances (Optional)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Record details regarding household situation, eligibility, or family background.
            </p>
          </div>

          <div>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Record details regarding household situation, financial distress, reason for aid, or special conditions..."
              className="input-field"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
          <Link
            href="/admin/beneficiaries"
            className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 rounded-xl transition-colors text-center"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-all"
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
