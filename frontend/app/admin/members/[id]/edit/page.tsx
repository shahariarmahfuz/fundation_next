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
  Users,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Camera,
  PenTool,
  UploadCloud,
  Trash2,
  ExternalLink,
  ShieldCheck
} from "lucide-react";

export default function EditMemberPage() {
  const params = useParams();
  const router = useRouter();
  const { flash } = useFlash();

  const memberId = params?.id ? String(params.id) : "";

  // Data fetching state
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);

  // Original member reference
  const [member, setMember] = useState<any | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    full_name: "",
    group_id: "",
    member_number: "",
    joining_date: "",
    status: "ACTIVE",

    // Optional Personal
    father_name: "",
    mother_name: "",
    date_of_birth: "",
    gender: "",
    nid_or_id: "",
    occupation: "",
    education: "",
    blood_group: "",
    marital_status: "",
    phone: "",
    alternative_phone: "",
    email: "",
    present_address: "",
    permanent_address: "",

    // Optional Emergency
    emergency_contact_name: "",
    emergency_contact_relationship: "",
    emergency_contact_phone: "",

    // Optional Reference
    reference_name: "",
    reference_phone: "",
    reference_relationship: "",

    // Optional Documents
    photo_url: "",
    photo_public_id: "",
    signature_url: "",
    signature_public_id: "",
    document_type: "NATIONAL_ID",
    nid_front_url: "",
    nid_front_public_id: "",
    nid_back_url: "",
    nid_back_public_id: "",
    birth_certificate_url: "",
    birth_certificate_public_id: "",

    // Optional Remarks
    reason_for_joining: "",
    notes: "",
  });

  // Section accordions
  const [openSections, setOpenSections] = useState({
    personal: true,
    emergency: false,
    reference: false,
    documents: false,
    additional: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Uploading state
  const [uploadingState, setUploadingState] = useState<Record<string, boolean>>({});
  const [uploadError, setUploadError] = useState<Record<string, string>>({});

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [inlineSuccess, setInlineSuccess] = useState<string | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);

  // Load Member & Groups
  const loadData = async () => {
    if (!memberId) return;
    setLoading(true);
    setFetchError(null);
    setNotFound(false);

    try {
      const [memberData, groupsData] = await Promise.all([
        api.get(`/members/${memberId}`),
        api.get("/groups"),
      ]);

      setMember(memberData);
      setGroups(groupsData || []);

      // Populate form
      setFormData({
        full_name: memberData.full_name || "",
        group_id: memberData.group_id ? String(memberData.group_id) : "",
        member_number: memberData.member_number || memberData.code || "",
        joining_date: memberData.joining_date ? memberData.joining_date.split("T")[0] : "",
        status: memberData.status || "ACTIVE",

        father_name: memberData.father_name || "",
        mother_name: memberData.mother_name || "",
        date_of_birth: memberData.date_of_birth ? memberData.date_of_birth.split("T")[0] : "",
        gender: memberData.gender || "",
        nid_or_id: memberData.nid_or_id || "",
        occupation: memberData.occupation || "",
        education: memberData.education || "",
        blood_group: memberData.blood_group || "",
        marital_status: memberData.marital_status || "",
        phone: memberData.phone || "",
        alternative_phone: memberData.alternative_phone || "",
        email: memberData.email || "",
        present_address: memberData.present_address || "",
        permanent_address: memberData.permanent_address || memberData.address || "",

        emergency_contact_name: memberData.emergency_contact_name || "",
        emergency_contact_relationship: memberData.emergency_contact_relationship || "",
        emergency_contact_phone: memberData.emergency_contact_phone || "",

        reference_name: memberData.reference_name || "",
        reference_phone: memberData.reference_phone || "",
        reference_relationship: memberData.reference_relationship || "",
        photo_url: memberData.photo_url || "",
        photo_public_id: memberData.photo_public_id || "",
        signature_url: memberData.signature_url || "",
        signature_public_id: memberData.signature_public_id || "",
        document_type: memberData.document_type || "NATIONAL_ID",
        nid_front_url: memberData.nid_front_url || "",
        nid_front_public_id: memberData.nid_front_public_id || "",
        nid_back_url: memberData.nid_back_url || "",
        nid_back_public_id: memberData.nid_back_public_id || "",
        birth_certificate_url: memberData.birth_certificate_url || "",
        birth_certificate_public_id: memberData.birth_certificate_public_id || "",

        reason_for_joining: memberData.reason_for_joining || "",
        notes: memberData.notes || "",
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
    loadData();
  }, [memberId]);

  // File Upload Handlers
  const handleFileUpload = async (file: File, category: string) => {
    setUploadingState((prev) => ({ ...prev, [category]: true }));
    setUploadError((prev) => ({ ...prev, [category]: "" }));

    const fd = new FormData();
    fd.append("file", file);
    fd.append("category", category);

    try {
      const res = await api.upload<{
        secure_url: string;
        public_id: string;
      }>("/members/upload-temp", fd);

      if (category === "PHOTO") {
        setFormData((prev) => ({ ...prev, photo_url: res.secure_url, photo_public_id: res.public_id }));
      } else if (category === "SIGNATURE") {
        setFormData((prev) => ({ ...prev, signature_url: res.secure_url, signature_public_id: res.public_id }));
      } else if (category === "NID_FRONT") {
        setFormData((prev) => ({ ...prev, nid_front_url: res.secure_url, nid_front_public_id: res.public_id }));
      } else if (category === "NID_BACK") {
        setFormData((prev) => ({ ...prev, nid_back_url: res.secure_url, nid_back_public_id: res.public_id }));
      } else if (category === "BIRTH_CERTIFICATE") {
        setFormData((prev) => ({ ...prev, birth_certificate_url: res.secure_url, birth_certificate_public_id: res.public_id }));
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
      setFormData((prev) => ({ ...prev, photo_url: "", photo_public_id: "" }));
    } else if (category === "SIGNATURE") {
      setFormData((prev) => ({ ...prev, signature_url: "", signature_public_id: "" }));
    } else if (category === "NID_FRONT") {
      setFormData((prev) => ({ ...prev, nid_front_url: "", nid_front_public_id: "" }));
    } else if (category === "NID_BACK") {
      setFormData((prev) => ({ ...prev, nid_back_url: "", nid_back_public_id: "" }));
    } else if (category === "BIRTH_CERTIFICATE") {
      setFormData((prev) => ({ ...prev, birth_certificate_url: "", birth_certificate_public_id: "" }));
    }
  };

  const cleanVal = (val?: string) => {
    if (!val) return undefined;
    const t = val.trim();
    return t.length > 0 ? t : undefined;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Only Full Name and Group are required
    if (!formData.full_name || !formData.full_name.trim()) {
      setInlineError("Full Name is required.");
      flash.warning("Missing Name", "Please enter member's full name.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!formData.group_id) {
      setInlineError("Group selection is required. Member must be assigned to an accounting group.");
      flash.warning("Missing Group", "Please select an accounting group.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitting(true);
    setInlineError(null);
    setInlineSuccess(null);

    try {
      const payload: any = {
        full_name: formData.full_name.trim(),
        group_id: parseInt(formData.group_id),
        status: formData.status || "ACTIVE",

        member_number: cleanVal(formData.member_number),
        code: cleanVal(formData.member_number),
        joining_date: cleanVal(formData.joining_date),

        phone: cleanVal(formData.phone),
        alternative_phone: cleanVal(formData.alternative_phone),
        email: cleanVal(formData.email),
        address: cleanVal(formData.permanent_address) || cleanVal(formData.present_address),
        present_address: cleanVal(formData.present_address),
        permanent_address: cleanVal(formData.permanent_address),
        nid_or_id: cleanVal(formData.nid_or_id),
        father_name: cleanVal(formData.father_name),
        mother_name: cleanVal(formData.mother_name),
        date_of_birth: cleanVal(formData.date_of_birth),
        gender: cleanVal(formData.gender),
        occupation: cleanVal(formData.occupation),
        education: cleanVal(formData.education),
        blood_group: cleanVal(formData.blood_group),
        marital_status: cleanVal(formData.marital_status),

        emergency_contact_name: cleanVal(formData.emergency_contact_name),
        emergency_contact_relationship: cleanVal(formData.emergency_contact_relationship),
        emergency_contact_phone: cleanVal(formData.emergency_contact_phone),

        reference_name: cleanVal(formData.reference_name),
        reference_phone: cleanVal(formData.reference_phone),
        reference_relationship: cleanVal(formData.reference_relationship),

        photo_url: cleanVal(formData.photo_url),
        photo_public_id: cleanVal(formData.photo_public_id),
        signature_url: cleanVal(formData.signature_url),
        signature_public_id: cleanVal(formData.signature_public_id),
        document_type: cleanVal(formData.document_type),
        nid_front_url: cleanVal(formData.nid_front_url),
        nid_front_public_id: cleanVal(formData.nid_front_public_id),
        nid_back_url: cleanVal(formData.nid_back_url),
        nid_back_public_id: cleanVal(formData.nid_back_public_id),
        birth_certificate_url: cleanVal(formData.birth_certificate_url),
        birth_certificate_public_id: cleanVal(formData.birth_certificate_public_id),

        reason_for_joining: cleanVal(formData.reason_for_joining),
        notes: cleanVal(formData.notes),
      };

      const updated = await api.put(`/members/${memberId}`, payload);
      setMember(updated);

      // Show modern animated flash and inline banner
      flash.success("Member updated successfully", `Record for "${updated.full_name}" [${updated.member_number}] has been saved to the database.`);
      setInlineSuccess("Member updated successfully");
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Automatically hide inline success banner after 5s
      setTimeout(() => {
        setInlineSuccess(null);
      }, 5000);
    } catch (err: any) {
      const msg = getUserFriendlyErrorMessage(err);
      setInlineError(msg);
      flash.error("Unable to update member", msg);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  };

  // Loading Skeleton State
  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            <div className="h-4 w-72 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xs flex flex-col items-center justify-center min-h-[360px]">
          <Loader2 className="h-9 w-9 animate-spin text-emerald-600 mb-3" />
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Loading member record details...
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
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Member not found</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            The requested member record (ID: {memberId}) does not exist or may have been removed.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/admin/members"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors shadow-xs"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to Manage Members
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Fetch Error State
  if (fetchError) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto py-12">
        <div className="rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 p-8 shadow-xs text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-rose-600 dark:text-rose-400 mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Unable to Load Member</h2>
          <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">{fetchError}</p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={loadData}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 transition-colors shadow-xs"
            >
              Retry Loading
            </button>
            <Link
              href="/admin/members"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Manage Members
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header with Back, Title, and Action Links */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/members"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
            title="Return to Manage Members"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Edit Member
              </h1>
              {member && (
                <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {member.member_number}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Update member profile, group assignment, contact info, and documentation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {member && (
            <Link
              href={`/admin/members/${member.id}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
            >
              <ExternalLink className="h-4 w-4 text-slate-400" />
              View Profile
            </Link>
          )}
          <Link
            href="/admin/members"
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

      {/* Main Edit Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: CORE / REQUIRED INFORMATION */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs transition-colors">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Core Membership Details
            </h2>
            <span className="ml-auto text-xs text-slate-400">
              * Full Name & Group are required
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Full Name (Required) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Enter member's full legal name"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Accounting Group (Required) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Accounting Group <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={formData.group_id}
                onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="">Select an Accounting Group</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    [{g.code}] {g.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Member Code / ID */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Member Code / ID
              </label>
              <input
                type="text"
                value={formData.member_number}
                onChange={(e) => setFormData({ ...formData, member_number: e.target.value.toUpperCase() })}
                placeholder="e.g. MEM-0001"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Unique identifier across ledgers and contribution records.
              </p>
            </div>

            {/* Membership Status */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Membership Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>

            {/* Join Date */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Join Date
              </label>
              <input
                type="date"
                value={formData.joining_date}
                onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: PERSONAL & CONTACT INFORMATION (COLLAPSIBLE) */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs transition-colors overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("personal")}
            className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Personal & Contact Information
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Phone, email, NID/Birth Certificate, addresses, and demographic details
                </p>
              </div>
            </div>
            {openSections.personal ? (
              <ChevronUp className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            )}
          </button>

          {openSections.personal && (
            <div className="p-6 pt-0 border-t border-slate-100 dark:border-slate-800/60 mt-2">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {/* Mobile Number */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+880 1711-000000"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Alternative Mobile */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Alternative Mobile
                  </label>
                  <input
                    type="text"
                    value={formData.alternative_phone}
                    onChange={(e) => setFormData({ ...formData, alternative_phone: e.target.value })}
                    placeholder="+880 1811-000000"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="member@domain.com"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* NID / Birth Certificate */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    NID / Birth Certificate Number
                  </label>
                  <input
                    type="text"
                    value={formData.nid_or_id}
                    onChange={(e) => setFormData({ ...formData, nid_or_id: e.target.value })}
                    placeholder="e.g. 19901234567890"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Father's Name */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Father’s Name
                  </label>
                  <input
                    type="text"
                    value={formData.father_name}
                    onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                    placeholder="Father's full name"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Mother's Name */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Mother’s Name
                  </label>
                  <input
                    type="text"
                    value={formData.mother_name}
                    onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })}
                    placeholder="Mother's full name"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="">Select Gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                {/* Blood Group */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Blood Group
                  </label>
                  <select
                    value={formData.blood_group}
                    onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                {/* Marital Status */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Marital Status
                  </label>
                  <select
                    value={formData.marital_status}
                    onChange={(e) => setFormData({ ...formData, marital_status: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="">Select Marital Status</option>
                    <option value="SINGLE">Single</option>
                    <option value="MARRIED">Married</option>
                    <option value="WIDOWED">Widowed</option>
                    <option value="DIVORCED">Divorced</option>
                  </select>
                </div>

                {/* Occupation */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Occupation / Workplace
                  </label>
                  <input
                    type="text"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    placeholder="e.g. Business, Teacher, Service"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Education */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Education
                  </label>
                  <input
                    type="text"
                    value={formData.education}
                    onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                    placeholder="e.g. Graduate, HSC, Alim"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Present Address */}
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Present Address
                  </label>
                  <input
                    type="text"
                    value={formData.present_address}
                    onChange={(e) => setFormData({ ...formData, present_address: e.target.value })}
                    placeholder="House, Road, Area, Thana, District"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Permanent Address */}
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Permanent Address
                  </label>
                  <input
                    type="text"
                    value={formData.permanent_address}
                    onChange={(e) => setFormData({ ...formData, permanent_address: e.target.value })}
                    placeholder="Village, Post Office, Upazila, District"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 3: EMERGENCY CONTACT (COLLAPSIBLE) */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs transition-colors overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("emergency")}
            className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Emergency Contact
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Designated emergency contact person in case of urgent notices
                </p>
              </div>
            </div>
            {openSections.emergency ? (
              <ChevronUp className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            )}
          </button>

          {openSections.emergency && (
            <div className="p-6 pt-0 border-t border-slate-100 dark:border-slate-800/60 mt-2">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    value={formData.emergency_contact_name}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                    placeholder="Full Name"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Relationship
                  </label>
                  <input
                    type="text"
                    value={formData.emergency_contact_relationship}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_relationship: e.target.value })}
                    placeholder="e.g. Spouse, Brother, Father"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                    placeholder="+880 1711-000000"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 4: REFERENCE (COLLAPSIBLE) */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs transition-colors overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("reference")}
            className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Reference Information
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Introducer or existing foundation member reference
                </p>
              </div>
            </div>
            {openSections.reference ? (
              <ChevronUp className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            )}
          </button>

          {openSections.reference && (
            <div className="p-6 pt-0 border-t border-slate-100 dark:border-slate-800/60 mt-2">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Reference Name
                  </label>
                  <input
                    type="text"
                    value={formData.reference_name}
                    onChange={(e) => setFormData({ ...formData, reference_name: e.target.value })}
                    placeholder="Reference person name"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Relationship / Designation
                  </label>
                  <input
                    type="text"
                    value={formData.reference_relationship}
                    onChange={(e) => setFormData({ ...formData, reference_relationship: e.target.value })}
                    placeholder="e.g. Existing Member, Colleague"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Reference Phone
                  </label>
                  <input
                    type="text"
                    value={formData.reference_phone}
                    onChange={(e) => setFormData({ ...formData, reference_phone: e.target.value })}
                    placeholder="+880 1711-000000"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 5: DOCUMENTS & MEDIA (CLOUDINARY) */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs transition-colors overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("documents")}
            className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Camera className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Media & Identification Documents
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Member photo, signature, NID scan, or birth certificate (Cloudinary secured)
                </p>
              </div>
            </div>
            {openSections.documents ? (
              <ChevronUp className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            )}
          </button>

          {openSections.documents && (
            <div className="p-6 pt-0 border-t border-slate-100 dark:border-slate-800/60 mt-2 space-y-6">
              {/* Photo & Signature Row */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Member Photo */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Member Photo
                  </label>
                  {formData.photo_url ? (
                    <div className="relative flex items-center gap-4 rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-950">
                      <img
                        src={formData.photo_url}
                        alt="Member Photo"
                        className="h-16 w-16 rounded-lg object-cover border border-slate-300 dark:border-slate-700"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                          Photo Uploaded
                        </p>
                        <a
                          href={formData.photo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 mt-0.5"
                        >
                          View Full Asset <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFileRemove("PHOTO")}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                        title="Remove Photo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        id="photo-upload"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleFileUpload(e.target.files[0], "PHOTO");
                        }}
                      />
                      <label
                        htmlFor="photo-upload"
                        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-4 text-center hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors"
                      >
                        {uploadingState["PHOTO"] ? (
                          <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mb-1" />
                        ) : (
                          <Camera className="h-6 w-6 text-slate-400 mb-1" />
                        )}
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {uploadingState["PHOTO"] ? "Uploading..." : "Upload Member Photo"}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG up to 10MB</span>
                      </label>
                    </div>
                  )}
                  {uploadError["PHOTO"] && (
                    <p className="text-xs text-rose-600 dark:text-rose-400">{uploadError["PHOTO"]}</p>
                  )}
                </div>

                {/* Member Signature */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Member Signature
                  </label>
                  {formData.signature_url ? (
                    <div className="relative flex items-center gap-4 rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-950">
                      <img
                        src={formData.signature_url}
                        alt="Member Signature"
                        className="h-16 w-24 rounded-lg object-contain bg-white border border-slate-300 dark:border-slate-700 p-1"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                          Signature Uploaded
                        </p>
                        <a
                          href={formData.signature_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 mt-0.5"
                        >
                          View Signature <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFileRemove("SIGNATURE")}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                        title="Remove Signature"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        id="signature-upload"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleFileUpload(e.target.files[0], "SIGNATURE");
                        }}
                      />
                      <label
                        htmlFor="signature-upload"
                        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-4 text-center hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors"
                      >
                        {uploadingState["SIGNATURE"] ? (
                          <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mb-1" />
                        ) : (
                          <PenTool className="h-6 w-6 text-slate-400 mb-1" />
                        )}
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {uploadingState["SIGNATURE"] ? "Uploading..." : "Upload Signature"}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">Scanned sign or digital drawing</span>
                      </label>
                    </div>
                  )}
                  {uploadError["SIGNATURE"] && (
                    <p className="text-xs text-rose-600 dark:text-rose-400">{uploadError["SIGNATURE"]}</p>
                  )}
                </div>
              </div>

              {/* Document Type Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Primary Identification Document Type
                </label>
                <div className="flex gap-4">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="document_type"
                      value="NATIONAL_ID"
                      checked={formData.document_type === "NATIONAL_ID"}
                      onChange={() => setFormData({ ...formData, document_type: "NATIONAL_ID" })}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-slate-800 dark:text-slate-200">National ID (NID)</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="document_type"
                      value="BIRTH_CERTIFICATE"
                      checked={formData.document_type === "BIRTH_CERTIFICATE"}
                      onChange={() => setFormData({ ...formData, document_type: "BIRTH_CERTIFICATE" })}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-slate-800 dark:text-slate-200">Birth Certificate</span>
                  </label>
                </div>
              </div>

              {/* NID Front / Back Uploads */}
              {formData.document_type === "NATIONAL_ID" && (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      NID Front Side
                    </label>
                    {formData.nid_front_url ? (
                      <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                        <img src={formData.nid_front_url} alt="NID Front" className="h-12 w-20 object-cover rounded" />
                        <span className="text-xs flex-1 truncate">NID Front Attached</span>
                        <button type="button" onClick={() => handleFileRemove("NID_FRONT")} className="text-rose-500 p-1">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-4 text-center hover:bg-slate-50 dark:hover:bg-slate-950">
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "NID_FRONT")}
                        />
                        <UploadCloud className="h-5 w-5 text-slate-400 mb-1" />
                        <span className="text-xs font-semibold">Upload NID Front</span>
                      </label>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      NID Back Side
                    </label>
                    {formData.nid_back_url ? (
                      <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                        <img src={formData.nid_back_url} alt="NID Back" className="h-12 w-20 object-cover rounded" />
                        <span className="text-xs flex-1 truncate">NID Back Attached</span>
                        <button type="button" onClick={() => handleFileRemove("NID_BACK")} className="text-rose-500 p-1">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-4 text-center hover:bg-slate-50 dark:hover:bg-slate-950">
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "NID_BACK")}
                        />
                        <UploadCloud className="h-5 w-5 text-slate-400 mb-1" />
                        <span className="text-xs font-semibold">Upload NID Back</span>
                      </label>
                    )}
                  </div>
                </div>
              )}

              {/* Birth Certificate Upload */}
              {formData.document_type === "BIRTH_CERTIFICATE" && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Birth Certificate Document
                  </label>
                  {formData.birth_certificate_url ? (
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                      <img src={formData.birth_certificate_url} alt="Birth Certificate" className="h-12 w-20 object-cover rounded" />
                      <span className="text-xs flex-1 truncate">Birth Certificate Attached</span>
                      <button type="button" onClick={() => handleFileRemove("BIRTH_CERTIFICATE")} className="text-rose-500 p-1">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-4 text-center hover:bg-slate-50 dark:hover:bg-slate-950">
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "BIRTH_CERTIFICATE")}
                      />
                      <UploadCloud className="h-5 w-5 text-slate-400 mb-1" />
                      <span className="text-xs font-semibold">Upload Birth Certificate</span>
                    </label>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* SECTION 6: COMMITMENT & REMARKS (COLLAPSIBLE) */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs transition-colors overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("additional")}
            className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Additional Information
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Reason for joining and administrative notes
                </p>
              </div>
            </div>
            {openSections.additional ? (
              <ChevronUp className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            )}
          </button>

          {openSections.additional && (
            <div className="p-6 pt-0 border-t border-slate-100 dark:border-slate-800/60 mt-2 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Reason for Joining
                </label>
                <textarea
                  rows={2}
                  value={formData.reason_for_joining}
                  onChange={(e) => setFormData({ ...formData, reason_for_joining: e.target.value })}
                  placeholder="Motivation, community welfare goals, etc."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Administrative Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Internal notes or verification records..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM STICKY ACTION BAR */}
        <div className="sticky bottom-4 z-20 flex items-center justify-between gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 shadow-lg">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Editing Member <span className="font-semibold text-slate-700 dark:text-slate-200">{member?.full_name}</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/members"
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
