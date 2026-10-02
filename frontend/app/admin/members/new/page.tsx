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
  ChevronUp
} from "lucide-react";

export default function NewMemberPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<any[]>([]);
  const [foundationRate, setFoundationRate] = useState<number>(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    // Optional Commitment & Docs
    commitment: "",
    photo_url: "",
    signature_url: "",
    document_type: "",
    nid_front_url: "",
    nid_back_url: "",

    // Optional Remarks
    reason_for_joining: "",
    notes: "",
  });

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

        // Commitment & Documents
        commitment: cleanVal(formData.commitment),
        photo_url: cleanVal(formData.photo_url),
        signature_url: cleanVal(formData.signature_url),
        document_type: cleanVal(formData.document_type),
        nid_front_url: cleanVal(formData.nid_front_url),
        nid_back_url: cleanVal(formData.nid_back_url),

        // Reason & Remarks
        reason_for_joining: cleanVal(formData.reason_for_joining),
        notes: cleanVal(formData.notes),
      };

      const res = await api.post("/members", payload);
      router.push(`/admin/members/${res.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create member");
      setLoading(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
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
                5. Documents <span className="text-slate-400 font-normal text-xs">(Optional)</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Member photo, signature, and national ID document links
              </p>
            </div>
            {openSections.documents ? (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            )}
          </button>

          {openSections.documents && (
            <div className="p-6 pt-0 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Document Type
                  </label>
                  <select
                    className="input-field"
                    value={formData.document_type}
                    onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
                  >
                    <option value="">Select document type (optional)</option>
                    <option value="National ID">National ID (NID)</option>
                    <option value="Passport">Passport</option>
                    <option value="Birth Certificate">Birth Certificate</option>
                    <option value="Driving License">Driving License</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Member Photo URL
                  </label>
                  <input
                    type="url"
                    className="input-field"
                    placeholder="https://.../photo.jpg"
                    value={formData.photo_url}
                    onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Signature URL
                  </label>
                  <input
                    type="url"
                    className="input-field"
                    placeholder="https://.../signature.png"
                    value={formData.signature_url}
                    onChange={(e) => setFormData({ ...formData, signature_url: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    National ID Front URL
                  </label>
                  <input
                    type="url"
                    className="input-field"
                    placeholder="https://.../nid_front.jpg"
                    value={formData.nid_front_url}
                    onChange={(e) => setFormData({ ...formData, nid_front_url: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    National ID Back URL
                  </label>
                  <input
                    type="url"
                    className="input-field"
                    placeholder="https://.../nid_back.jpg"
                    value={formData.nid_back_url}
                    onChange={(e) => setFormData({ ...formData, nid_back_url: e.target.value })}
                  />
                </div>
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
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Registering Member...
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
