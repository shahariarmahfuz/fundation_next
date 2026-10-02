"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Coins,
  User,
  ShieldAlert,
  FileText,
  UploadCloud,
  CheckCircle2,
  Users,
  ChevronDown,
  ChevronUp,
  Camera,
  PenTool,
  Trash2,
  Image as ImageIcon,
  File as FileIcon,
  UserPlus,
  X
} from "lucide-react";

interface CreatedMemberInfo {
  id: number;
  full_name: string;
  member_number: string;
  group_name: string;
}

const getInitialFormData = (defaultGroupId: string = "") => ({
  full_name: "",
  group_id: defaultGroupId,
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

  // Optional Commitment & Docs (Cloudinary backed)
  commitment: "",
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

export default function NewMemberPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<any[]>([]);
  const [foundationRate, setFoundationRate] = useState<number>(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdMember, setCreatedMember] = useState<CreatedMemberInfo | null>(null);

  // Sections toggle for clean UI
  const [openSections, setOpenSections] = useState({
    personal: true,
    emergency: false,
    reference: false,
    commitment: false,
    documents: false,
    additional: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Form State — ONLY full_name and group_id are required
  const [formData, setFormData] = useState(getInitialFormData());

  const [uploadingState, setUploadingState] = useState<Record<string, boolean>>({});
  const [uploadError, setUploadError] = useState<Record<string, string>>({});

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
        format?: string;
        bytes?: number;
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupsData, settingData] = await Promise.all([
          api.get("/groups"),
          api.get("/settings/monthly-contribution").catch(() => null),
        ]);
        setGroups(groupsData || []);
        if (groupsData && groupsData.length > 0) {
          setFormData((prev) => ({ ...prev, group_id: String(groupsData[0].id) }));
        }
        if (settingData?.current_amount) {
          setFoundationRate(parseFloat(settingData.current_amount));
        }
      } catch (err: any) {
        setError(err.message || "Failed to load accounting groups");
      }
    };
    fetchData();
  }, []);

  const cleanVal = (v: string | undefined | null) => {
    if (!v) return undefined;
    const t = v.trim();
    return t ? t : undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Strict validation: ONLY Full Name and Group are required
    if (!formData.full_name || !formData.full_name.trim()) {
      setError("Full name is required.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!formData.group_id) {
      setError("Please select an accounting Group. A member must belong to a group.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload: any = {
        full_name: formData.full_name.trim(),
        group_id: parseInt(formData.group_id),
        status: formData.status || "ACTIVE",

        // Auto-generated if omitted or empty
        member_number: cleanVal(formData.member_number),
        code: cleanVal(formData.member_number),

        // Optional profile fields
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

        // Emergency contact
        emergency_contact_name: cleanVal(formData.emergency_contact_name),
        emergency_contact_relationship: cleanVal(formData.emergency_contact_relationship),
        emergency_contact_phone: cleanVal(formData.emergency_contact_phone),

        // Reference
        reference_name: cleanVal(formData.reference_name),
        reference_phone: cleanVal(formData.reference_phone),
        reference_relationship: cleanVal(formData.reference_relationship),

        // Commitment & Documents (Cloudinary)
        commitment: cleanVal(formData.commitment),
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

        // Reason & Remarks
        reason_for_joining: cleanVal(formData.reason_for_joining),
        notes: cleanVal(formData.notes),
      };

      const res = await api.post("/members", payload);

      // Extract accurate group name and code from backend response
      const assignedGroup = groups.find((g) => g.id === parseInt(formData.group_id));
      const groupName = res.group?.name || assignedGroup?.name || "Assigned Group";
      const memberCode = res.code || res.member_number || "M-Auto";

      setCreatedMember({
        id: res.id,
        full_name: res.full_name,
        member_number: memberCode,
        group_name: groupName,
      });

      // Reset form so the user can immediately add another member
      setFormData(getInitialFormData(groups.length > 0 ? String(groups[0].id) : ""));
      setUploadingState({});
      setUploadError({});
      setError(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      // Do NOT clear form on error — keep user's input intact
      setError(err.message || "Unable to create member. Please correct the issue and try again.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/members"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Register New Member
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Only <strong className="text-slate-700 dark:text-slate-200">Full Name</strong> and{" "}
            <strong className="text-slate-700 dark:text-slate-200">Group</strong> are required. Everything else is optional.
          </p>
        </div>
      </div>

      {/* Success Banner */}
      {createdMember && (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/90 dark:bg-emerald-950/40 p-5 sm:p-6 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/20">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
                  ✓ Member added successfully
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                  <span className="font-semibold text-emerald-950 dark:text-emerald-50">{createdMember.full_name}</span> has been added successfully.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCreatedMember(null)}
              className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200 p-1 rounded-lg transition-colors cursor-pointer"
              title="Dismiss message"
              aria-label="Dismiss message"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Member Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="rounded-xl border border-emerald-200/70 dark:border-emerald-800/60 bg-white/80 dark:bg-slate-900/80 px-4 py-2.5">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Member ID:</span>
              <span className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-400">
                {createdMember.member_number}
              </span>
            </div>
            <div className="rounded-xl border border-emerald-200/70 dark:border-emerald-800/60 bg-white/80 dark:bg-slate-900/80 px-4 py-2.5">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Group:</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {createdMember.group_name}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60">
            <button
              type="button"
              onClick={() => {
                setCreatedMember(null);
                const nameInput = document.getElementById("member-full-name-input");
                nameInput?.focus();
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors cursor-pointer"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Add Another Member
            </button>

            <Link
              href="/admin/members"
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
            >
              <Users className="h-3.5 w-3.5" />
              Manage Members
            </Link>
          </div>
        </div>
      )}

      {/* Global Error Banner */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-800 p-4 text-xs sm:text-sm text-rose-800 dark:text-rose-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Required Section: Name & Group */}
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 shadow-sm space-y-5">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Required Information
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              These two fields are strictly required to create a member.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="member-full-name-input"
                required
                type="text"
                className="input-field"
                placeholder="Member's full name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Group <span className="text-rose-500">*</span>
              </label>
              <select
                required
                className="input-field font-semibold"
                value={formData.group_id}
                onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}
              >
                <option value="">Select a group</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.code})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-slate-400">
                Determines the group account where contributions will be credited.
              </p>
            </div>
          </div>

          {/* Global Monthly Contribution info */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 dark:border-emerald-800 dark:bg-emerald-950/30 p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                  Global Monthly Contribution Setting
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">
                  Foundation Setting
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                All active foundation members follow the global monthly contribution setting.
              </p>
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white shrink-0">
              {formatCurrency(foundationRate)}
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-1">/ month</span>
            </div>
          </div>
        </div>

        {/* SECTION 1: Personal Information (Optional) */}
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("personal")}
            className="w-full p-5 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                1. Personal Information <span className="text-slate-400 font-normal text-xs">(Optional)</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Contact details, identification, demographic background
              </p>
            </div>
            {openSections.personal ? (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            )}
          </button>

          {openSections.personal && (
            <div className="p-6 pt-0 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Member ID / Code
                  </label>
                  <input
                    type="text"
                    className="input-field font-mono uppercase"
                    placeholder="Optional — leave blank to generate automatically"
                    value={formData.member_number}
                    onChange={(e) => setFormData({ ...formData, member_number: e.target.value.toUpperCase() })}
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Format: M-XXXX (e.g. M-0001, M-0100)
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Join Date
                  </label>
                  <input
                    type="date"
                    className="input-field"
                    value={formData.joining_date}
                    onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="e.g. +880 1711-000000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Alternative Mobile
                  </label>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="e.g. +880 1811-000000"
                    value={formData.alternative_phone}
                    onChange={(e) => setFormData({ ...formData, alternative_phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="e.g. member@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    National ID / Birth Certificate Number
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. NID 1988269123456"
                    value={formData.nid_or_id}
                    onChange={(e) => setFormData({ ...formData, nid_or_id: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Father's Name
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Father's full name"
                    value={formData.father_name}
                    onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Mother's Name
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Mother's full name"
                    value={formData.mother_name}
                    onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    className="input-field"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Gender
                  </label>
                  <select
                    className="input-field"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="">Select gender (optional)</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Blood Group
                  </label>
                  <select
                    className="input-field"
                    value={formData.blood_group}
                    onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                  >
                    <option value="">Select blood group (optional)</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Marital Status
                  </label>
                  <select
                    className="input-field"
                    value={formData.marital_status}
                    onChange={(e) => setFormData({ ...formData, marital_status: e.target.value })}
                  >
                    <option value="">Select marital status (optional)</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Occupation / Workplace
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Teacher, Business"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Education
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Graduate, Masters, Diploma"
                    value={formData.education}
                    onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Present Address
                  </label>
                  <textarea
                    rows={2}
                    className="input-field"
                    placeholder="Current residential address..."
                    value={formData.present_address}
                    onChange={(e) => setFormData({ ...formData, present_address: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Permanent Address
                  </label>
                  <textarea
                    rows={2}
                    className="input-field"
                    placeholder="Permanent village/home address..."
                    value={formData.permanent_address}
                    onChange={(e) => setFormData({ ...formData, permanent_address: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: Emergency Contact (Optional) */}
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("emergency")}
            className="w-full p-5 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                2. Emergency Contact <span className="text-slate-400 font-normal text-xs">(Optional)</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Person to contact in case of emergency
              </p>
            </div>
            {openSections.emergency ? (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            )}
          </button>

          {openSections.emergency && (
            <div className="p-6 pt-0 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Emergency Contact Name
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Brother / Spouse name"
                    value={formData.emergency_contact_name}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Relationship
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Brother, Sister, Father"
                    value={formData.emergency_contact_relationship}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_relationship: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Emergency Mobile Number
                  </label>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="e.g. +880 1700-000000"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 3: Reference (Optional) */}
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("reference")}
            className="w-full p-5 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                3. Reference <span className="text-slate-400 font-normal text-xs">(Optional)</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Existing member or community referee details
              </p>
            </div>
            {openSections.reference ? (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            )}
          </button>

          {openSections.reference && (
            <div className="p-6 pt-0 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Reference Name
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Referee name"
                    value={formData.reference_name}
                    onChange={(e) => setFormData({ ...formData, reference_name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Reference Mobile Number
                  </label>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="Referee mobile"
                    value={formData.reference_phone}
                    onChange={(e) => setFormData({ ...formData, reference_phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Relationship / Connection
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Existing Member, Neighbor"
                    value={formData.reference_relationship}
                    onChange={(e) => setFormData({ ...formData, reference_relationship: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 4: Commitment & Agreement (Optional) */}
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("commitment")}
            className="w-full p-5 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                4. Commitment <span className="text-slate-400 font-normal text-xs">(Optional)</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Pledge or constitution adherence remarks
              </p>
            </div>
            {openSections.commitment ? (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            )}
          </button>

          {openSections.commitment && (
            <div className="p-6 pt-0 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <div className="pt-4">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Commitment Note / Statement
                </label>
                <textarea
                  rows={2}
                  className="input-field"
                  placeholder="I commit to upholding the foundation's principles and rules..."
                  value={formData.commitment}
                  onChange={(e) => setFormData({ ...formData, commitment: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>

        {/* SECTION 5: Documents (Optional) */}
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("documents")}
            className="w-full p-5 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                5. Documents & Media <span className="text-slate-400 font-normal text-xs">(Optional — Cloudinary Storage)</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Member photo, signature, and identity documents (all uploads are completely optional)
              </p>
            </div>
            {openSections.documents ? (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            )}
          </button>

          {openSections.documents && (
            <div className="p-6 pt-0 border-t border-slate-100 dark:border-slate-800 space-y-6">
              <div className="pt-4">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Document Type
                </label>
                <div className="max-w-xs">
                  <select
                    className="input-field"
                    value={formData.document_type}
                    onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
                  >
                    <option value="National ID">National ID (NID)</option>
                    <option value="Birth Certificate">Birth Certificate</option>
                  </select>
                </div>
              </div>

              {/* Upload Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. Member Photo */}
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-950/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Camera className="h-4 w-4 text-foundation-600 dark:text-emerald-400" />
                      Member Photo
                    </span>
                    <span className="text-[10px] text-slate-400">JPG, PNG, WEBP (Max 5MB)</span>
                  </div>

                  {formData.photo_url ? (
                    <div className="flex items-center gap-3 p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                      <img
                        src={formData.photo_url}
                        alt="Member Photo"
                        className="h-16 w-16 rounded-md object-cover border border-slate-200 dark:border-slate-700"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Uploaded to Cloudinary</span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate font-mono mt-0.5">
                          {formData.photo_public_id}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFileRemove("PHOTO")}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition-colors"
                        title="Remove photo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-foundation-500 dark:hover:border-emerald-500 rounded-lg p-4 cursor-pointer transition-colors bg-white dark:bg-slate-900/50">
                        {uploadingState["PHOTO"] ? (
                          <div className="flex items-center gap-2 text-xs text-foundation-600 dark:text-emerald-400">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Uploading to Cloudinary...</span>
                          </div>
                        ) : (
                          <div className="text-center">
                            <UploadCloud className="h-6 w-6 text-slate-400 mx-auto mb-1" />
                            <span className="text-xs font-medium text-foundation-700 dark:text-emerald-400">
                              Upload Photo
                            </span>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          disabled={uploadingState["PHOTO"]}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleFileUpload(f, "PHOTO");
                          }}
                        />
                      </label>
                      {uploadError["PHOTO"] && (
                        <p className="text-[11px] text-rose-500 mt-1">{uploadError["PHOTO"]}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Signature */}
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-950/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <PenTool className="h-4 w-4 text-foundation-600 dark:text-emerald-400" />
                      Signature
                    </span>
                    <span className="text-[10px] text-slate-400">PNG, JPG, WEBP (Max 2MB)</span>
                  </div>

                  {formData.signature_url ? (
                    <div className="flex items-center gap-3 p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                      <img
                        src={formData.signature_url}
                        alt="Signature"
                        className="h-12 w-24 object-contain bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 p-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Uploaded to Cloudinary</span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate font-mono mt-0.5">
                          {formData.signature_public_id}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFileRemove("SIGNATURE")}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition-colors"
                        title="Remove signature"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-foundation-500 dark:hover:border-emerald-500 rounded-lg p-4 cursor-pointer transition-colors bg-white dark:bg-slate-900/50">
                        {uploadingState["SIGNATURE"] ? (
                          <div className="flex items-center gap-2 text-xs text-foundation-600 dark:text-emerald-400">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Uploading to Cloudinary...</span>
                          </div>
                        ) : (
                          <div className="text-center">
                            <UploadCloud className="h-6 w-6 text-slate-400 mx-auto mb-1" />
                            <span className="text-xs font-medium text-foundation-700 dark:text-emerald-400">
                              Upload Signature
                            </span>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          disabled={uploadingState["SIGNATURE"]}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleFileUpload(f, "SIGNATURE");
                          }}
                        />
                      </label>
                      {uploadError["SIGNATURE"] && (
                        <p className="text-[11px] text-rose-500 mt-1">{uploadError["SIGNATURE"]}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Document Slots based on Document Type */}
                {formData.document_type === "Birth Certificate" ? (
                  <div className="md:col-span-2 rounded-lg border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-950/40">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <FileIcon className="h-4 w-4 text-foundation-600 dark:text-emerald-400" />
                        Birth Certificate Document
                      </span>
                      <span className="text-[10px] text-slate-400">PDF, JPG, PNG, WEBP (Max 10MB)</span>
                    </div>

                    {formData.birth_certificate_url ? (
                      <div className="flex items-center gap-3 p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                        <div className="h-14 w-14 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                          <FileIcon className="h-7 w-7" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Uploaded to Cloudinary</span>
                          </div>
                          <a
                            href={formData.birth_certificate_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline block truncate mt-0.5"
                          >
                            View Certificate Document
                          </a>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleFileRemove("BIRTH_CERTIFICATE")}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition-colors"
                          title="Remove document"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-foundation-500 dark:hover:border-emerald-500 rounded-lg p-5 cursor-pointer transition-colors bg-white dark:bg-slate-900/50">
                          {uploadingState["BIRTH_CERTIFICATE"] ? (
                            <div className="flex items-center gap-2 text-xs text-foundation-600 dark:text-emerald-400">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Uploading to Cloudinary...</span>
                            </div>
                          ) : (
                            <div className="text-center">
                              <UploadCloud className="h-6 w-6 text-slate-400 mx-auto mb-1" />
                              <span className="text-xs font-medium text-foundation-700 dark:text-emerald-400">
                                Upload Birth Certificate
                              </span>
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,application/pdf"
                            className="hidden"
                            disabled={uploadingState["BIRTH_CERTIFICATE"]}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleFileUpload(f, "BIRTH_CERTIFICATE");
                            }}
                          />
                        </label>
                        {uploadError["BIRTH_CERTIFICATE"] && (
                          <p className="text-[11px] text-rose-500 mt-1">{uploadError["BIRTH_CERTIFICATE"]}</p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {/* NID Front */}
                    <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-950/40">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <FileText className="h-4 w-4 text-foundation-600 dark:text-emerald-400" />
                          National ID Front
                        </span>
                        <span className="text-[10px] text-slate-400">PDF, JPG, PNG, WEBP (Max 10MB)</span>
                      </div>

                      {formData.nid_front_url ? (
                        <div className="flex items-center gap-3 p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                          <img
                            src={formData.nid_front_url}
                            alt="NID Front"
                            className="h-14 w-20 object-cover rounded border border-slate-200 dark:border-slate-700"
                            onError={(e: any) => {
                              e.target.style.display = "none";
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Uploaded to Cloudinary</span>
                            </div>
                            <a
                              href={formData.nid_front_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline block truncate mt-0.5"
                            >
                              View Document
                            </a>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleFileRemove("NID_FRONT")}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition-colors"
                            title="Remove document"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-foundation-500 dark:hover:border-emerald-500 rounded-lg p-4 cursor-pointer transition-colors bg-white dark:bg-slate-900/50">
                            {uploadingState["NID_FRONT"] ? (
                              <div className="flex items-center gap-2 text-xs text-foundation-600 dark:text-emerald-400">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Uploading to Cloudinary...</span>
                              </div>
                            ) : (
                              <div className="text-center">
                                <UploadCloud className="h-6 w-6 text-slate-400 mx-auto mb-1" />
                                <span className="text-xs font-medium text-foundation-700 dark:text-emerald-400">
                                  Upload NID Front
                                </span>
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,application/pdf"
                              className="hidden"
                              disabled={uploadingState["NID_FRONT"]}
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleFileUpload(f, "NID_FRONT");
                              }}
                            />
                          </label>
                          {uploadError["NID_FRONT"] && (
                            <p className="text-[11px] text-rose-500 mt-1">{uploadError["NID_FRONT"]}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* NID Back */}
                    <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-950/40">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <FileText className="h-4 w-4 text-foundation-600 dark:text-emerald-400" />
                          National ID Back
                        </span>
                        <span className="text-[10px] text-slate-400">PDF, JPG, PNG, WEBP (Max 10MB)</span>
                      </div>

                      {formData.nid_back_url ? (
                        <div className="flex items-center gap-3 p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                          <img
                            src={formData.nid_back_url}
                            alt="NID Back"
                            className="h-14 w-20 object-cover rounded border border-slate-200 dark:border-slate-700"
                            onError={(e: any) => {
                              e.target.style.display = "none";
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Uploaded to Cloudinary</span>
                            </div>
                            <a
                              href={formData.nid_back_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline block truncate mt-0.5"
                            >
                              View Document
                            </a>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleFileRemove("NID_BACK")}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition-colors"
                            title="Remove document"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-foundation-500 dark:hover:border-emerald-500 rounded-lg p-4 cursor-pointer transition-colors bg-white dark:bg-slate-900/50">
                            {uploadingState["NID_BACK"] ? (
                              <div className="flex items-center gap-2 text-xs text-foundation-600 dark:text-emerald-400">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Uploading to Cloudinary...</span>
                              </div>
                            ) : (
                              <div className="text-center">
                                <UploadCloud className="h-6 w-6 text-slate-400 mx-auto mb-1" />
                                <span className="text-xs font-medium text-foundation-700 dark:text-emerald-400">
                                  Upload NID Back
                                </span>
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,application/pdf"
                              className="hidden"
                              disabled={uploadingState["NID_BACK"]}
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleFileUpload(f, "NID_BACK");
                              }}
                            />
                          </label>
                          {uploadError["NID_BACK"] && (
                            <p className="text-[11px] text-rose-500 mt-1">{uploadError["NID_BACK"]}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* SECTION 6: Additional Information (Optional) */}
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("additional")}
            className="w-full p-5 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                6. Additional Information <span className="text-slate-400 font-normal text-xs">(Optional)</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Reason for joining and supplementary notes
              </p>
            </div>
            {openSections.additional ? (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            )}
          </button>

          {openSections.additional && (
            <div className="p-6 pt-0 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Reason for Joining
                  </label>
                  <textarea
                    rows={2}
                    className="input-field"
                    placeholder="Why would you like to become a member..."
                    value={formData.reason_for_joining}
                    onChange={(e) => setFormData({ ...formData, reason_for_joining: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Additional Information / Notes
                  </label>
                  <textarea
                    rows={2}
                    className="input-field"
                    placeholder="Any special remarks or comments..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Link
            href="/admin/members"
            className="rounded-xl border border-slate-300 dark:border-slate-700 px-5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Member...
              </>
            ) : (
              "Save Member"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
