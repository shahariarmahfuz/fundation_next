"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import { Modal } from "@/components/Modal";
import {
  User,
  ArrowLeft,
  FolderTree,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Coins,
  CheckCircle2,
  Clock,
  PlusCircle,
  Loader2,
  AlertCircle,
  Camera,
  UploadCloud,
  Trash2,
  FileText,
  Image as ImageIcon,
  PenTool,
  ExternalLink
} from "lucide-react";

export default function MemberProfilePage() {
  const params = useParams();
  const router = useRouter();
  const memberId = params.id as string;

  const [member, setMember] = useState<any | null>(null);
  const [ledger, setLedger] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [documents, setDocuments] = useState<any[]>([]);
  const [mediaUploading, setMediaUploading] = useState<Record<string, boolean>>({});
  const [mediaError, setMediaError] = useState<string | null>(null);

  const fetchMemberData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [m, l, docs] = await Promise.all([
        api.get(`/members/${memberId}`),
        api.get(`/reports/member-ledger/${memberId}`),
        api.get(`/members/${memberId}/documents`).catch(() => []),
      ]);
      setMember(m);
      setLedger(l);
      setDocuments(docs || []);
    } catch (err: any) {
      setError(err.message || "Failed to load member data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemberData();
  }, [memberId]);

  const handleUploadPhoto = async (file: File) => {
    setMediaUploading((prev) => ({ ...prev, PHOTO: true }));
    setMediaError(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      await api.upload(`/members/${memberId}/photo`, fd);
      await fetchMemberData();
    } catch (err: any) {
      setMediaError(err.message || "Failed to upload photo to Cloudinary.");
    } finally {
      setMediaUploading((prev) => ({ ...prev, PHOTO: false }));
    }
  };

  const handleDeletePhoto = async () => {
    if (!confirm("Are you sure you want to remove the member's profile photo?")) return;
    setMediaUploading((prev) => ({ ...prev, PHOTO: true }));
    try {
      await api.delete(`/members/${memberId}/photo`);
      await fetchMemberData();
    } catch (err: any) {
      setMediaError(err.message || "Failed to remove photo.");
    } finally {
      setMediaUploading((prev) => ({ ...prev, PHOTO: false }));
    }
  };

  const handleUploadSignature = async (file: File) => {
    setMediaUploading((prev) => ({ ...prev, SIGNATURE: true }));
    setMediaError(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      await api.upload(`/members/${memberId}/signature`, fd);
      await fetchMemberData();
    } catch (err: any) {
      setMediaError(err.message || "Failed to upload signature to Cloudinary.");
    } finally {
      setMediaUploading((prev) => ({ ...prev, SIGNATURE: false }));
    }
  };

  const handleDeleteSignature = async () => {
    if (!confirm("Are you sure you want to remove the member's signature?")) return;
    setMediaUploading((prev) => ({ ...prev, SIGNATURE: true }));
    try {
      await api.delete(`/members/${memberId}/signature`);
      await fetchMemberData();
    } catch (err: any) {
      setMediaError(err.message || "Failed to remove signature.");
    } finally {
      setMediaUploading((prev) => ({ ...prev, SIGNATURE: false }));
    }
  };

  const handleUploadDocument = async (file: File, category: string, docType: string) => {
    setMediaUploading((prev) => ({ ...prev, [category]: true }));
    setMediaError(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("document_category", category);
    fd.append("document_type", docType);
    try {
      await api.upload(`/members/${memberId}/documents`, fd);
      await fetchMemberData();
    } catch (err: any) {
      setMediaError(err.message || `Failed to upload ${category} document to Cloudinary.`);
    } finally {
      setMediaUploading((prev) => ({ ...prev, [category]: false }));
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      await api.delete(`/members/${memberId}/documents/${docId}`);
      await fetchMemberData();
    } catch (err: any) {
      setMediaError(err.message || "Failed to delete document.");
    }
  };


  if (loading && !member) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-foundation-700" />
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="space-y-4">
        <Link href="/admin/members" className="btn-secondary">
          <ArrowLeft className="h-4 w-4" />
          Back to Members
        </Link>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
          {error || "Member not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/members"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div className="relative group shrink-0">
            {member.photo_url ? (
              <img
                src={member.photo_url}
                alt={member.full_name}
                className="h-14 w-14 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
              />
            ) : (
              <div className="h-14 w-14 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400">
                <User className="h-7 w-7" />
              </div>
            )}
            <label className="absolute inset-0 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity" title="Change Photo">
              <Camera className="h-4 w-4" />
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={mediaUploading["PHOTO"]}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUploadPhoto(f);
                }}
              />
            </label>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {member.full_name}
              </h1>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                {member.member_number}
              </span>
              <StatusBadge status={member.status} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Joined on {formatDate(member.joining_date)}
            </p>
          </div>
        </div>

        <Link
          href={`/admin/contributions/receive?member_id=${member.id}`}
          className="btn-primary"
        >
          <PlusCircle className="h-4 w-4" />
          Receive Contribution
        </Link>
      </div>

      {/* Member Details & Financial Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Info & Documents Cards */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 dark:border-slate-800 dark:bg-slate-900 transition-colors">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Member Information
            </h3>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <FolderTree className="h-4 w-4 text-foundation-700 dark:text-emerald-400 shrink-0" />
                <span>Group:</span>
                <strong className="text-slate-900 dark:text-white">
                  {member.group?.name} ({member.group?.code})
                </strong>
              </div>

              {member.phone && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Phone className="h-4 w-4 text-foundation-700 dark:text-emerald-400 shrink-0" />
                  <span>Phone:</span>
                  <strong className="text-slate-900 dark:text-white">{member.phone}</strong>
                </div>
              )}

              {member.email && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Mail className="h-4 w-4 text-foundation-700 dark:text-emerald-400 shrink-0" />
                  <span>Email:</span>
                  <span className="text-slate-900 dark:text-white">{member.email}</span>
                </div>
              )}

              {member.nid_or_id && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <User className="h-4 w-4 text-foundation-700 dark:text-emerald-400 shrink-0" />
                  <span>NID/ID:</span>
                  <span className="text-slate-900 dark:text-white font-mono">{member.nid_or_id}</span>
                </div>
              )}

              {member.address && (
                <div className="flex items-start gap-2 text-slate-600 dark:text-slate-400">
                  <MapPin className="h-4 w-4 text-foundation-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>Address:</span>
                  <span className="text-slate-900 dark:text-white">{member.address}</span>
                </div>
              )}
            </div>

            {member.notes && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                <strong>Notes:</strong> {member.notes}
              </div>
            )}
          </div>

          {/* Documents & Media Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 dark:border-slate-800 dark:bg-slate-900 transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Documents & Media
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                Cloudinary Storage
              </span>
            </div>

            {mediaError && (
              <div className="rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 p-2.5 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{mediaError}</span>
              </div>
            )}

            {/* Photo & Signature Row */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Photo */}
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-center">
                <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Profile Photo
                </div>
                {member.photo_url ? (
                  <div className="space-y-2">
                    <img
                      src={member.photo_url}
                      alt="Photo"
                      className="h-16 w-16 mx-auto rounded-full object-cover border border-slate-200 dark:border-slate-700"
                    />
                    <div className="flex items-center justify-center gap-2">
                      <label className="text-[10px] text-foundation-600 dark:text-emerald-400 hover:underline cursor-pointer">
                        {mediaUploading["PHOTO"] ? "Uploading..." : "Replace"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          disabled={mediaUploading["PHOTO"]}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleUploadPhoto(f);
                          }}
                        />
                      </label>
                      <button
                        onClick={handleDeletePhoto}
                        disabled={mediaUploading["PHOTO"]}
                        className="text-[10px] text-rose-500 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="block p-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg hover:border-foundation-500 cursor-pointer">
                    {mediaUploading["PHOTO"] ? (
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-foundation-600" />
                    ) : (
                      <>
                        <Camera className="h-5 w-5 mx-auto text-slate-400 mb-1" />
                        <span className="text-[10px] text-foundation-600 dark:text-emerald-400 font-medium">Upload</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={mediaUploading["PHOTO"]}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUploadPhoto(f);
                      }}
                    />
                  </label>
                )}
              </div>

              {/* Signature */}
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-center">
                <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Signature
                </div>
                {member.signature_url ? (
                  <div className="space-y-2">
                    <img
                      src={member.signature_url}
                      alt="Signature"
                      className="h-12 w-24 mx-auto object-contain bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 p-1"
                    />
                    <div className="flex items-center justify-center gap-2">
                      <label className="text-[10px] text-foundation-600 dark:text-emerald-400 hover:underline cursor-pointer">
                        {mediaUploading["SIGNATURE"] ? "Uploading..." : "Replace"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          disabled={mediaUploading["SIGNATURE"]}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleUploadSignature(f);
                          }}
                        />
                      </label>
                      <button
                        onClick={handleDeleteSignature}
                        disabled={mediaUploading["SIGNATURE"]}
                        className="text-[10px] text-rose-500 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="block p-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg hover:border-foundation-500 cursor-pointer">
                    {mediaUploading["SIGNATURE"] ? (
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-foundation-600" />
                    ) : (
                      <>
                        <PenTool className="h-5 w-5 mx-auto text-slate-400 mb-1" />
                        <span className="text-[10px] text-foundation-600 dark:text-emerald-400 font-medium">Upload</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={mediaUploading["SIGNATURE"]}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUploadSignature(f);
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Identity Documents List */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Identity Documents ({member.document_type || "National ID"})
                </span>
              </div>

              {/* NID Front */}
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="h-4 w-4 text-slate-500 shrink-0" />
                  <span className="font-medium text-slate-800 dark:text-slate-200 truncate">NID Front</span>
                </div>
                {member.nid_front_url ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={member.nid_front_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-[11px]"
                    >
                      View <ExternalLink className="h-3 w-3" />
                    </a>
                    <label className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer text-[11px]">
                      {mediaUploading["NID_FRONT"] ? "Uploading..." : "Replace"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        className="hidden"
                        disabled={mediaUploading["NID_FRONT"]}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleUploadDocument(f, "NID_FRONT", member.document_type || "National ID");
                        }}
                      />
                    </label>
                  </div>
                ) : (
                  <label className="text-foundation-600 dark:text-emerald-400 hover:underline cursor-pointer text-[11px] font-medium">
                    {mediaUploading["NID_FRONT"] ? "Uploading..." : "Upload"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      className="hidden"
                      disabled={mediaUploading["NID_FRONT"]}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUploadDocument(f, "NID_FRONT", member.document_type || "National ID");
                      }}
                    />
                  </label>
                )}
              </div>

              {/* NID Back */}
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="h-4 w-4 text-slate-500 shrink-0" />
                  <span className="font-medium text-slate-800 dark:text-slate-200 truncate">NID Back</span>
                </div>
                {member.nid_back_url ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={member.nid_back_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-[11px]"
                    >
                      View <ExternalLink className="h-3 w-3" />
                    </a>
                    <label className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer text-[11px]">
                      {mediaUploading["NID_BACK"] ? "Uploading..." : "Replace"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        className="hidden"
                        disabled={mediaUploading["NID_BACK"]}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleUploadDocument(f, "NID_BACK", member.document_type || "National ID");
                        }}
                      />
                    </label>
                  </div>
                ) : (
                  <label className="text-foundation-600 dark:text-emerald-400 hover:underline cursor-pointer text-[11px] font-medium">
                    {mediaUploading["NID_BACK"] ? "Uploading..." : "Upload"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      className="hidden"
                      disabled={mediaUploading["NID_BACK"]}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUploadDocument(f, "NID_BACK", member.document_type || "National ID");
                      }}
                    />
                  </label>
                )}
              </div>

              {/* Birth Certificate if applicable */}
              {(member.document_type === "Birth Certificate" || member.birth_certificate_url) && (
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="h-4 w-4 text-slate-500 shrink-0" />
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate">Birth Certificate</span>
                  </div>
                  {member.birth_certificate_url ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={member.birth_certificate_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-[11px]"
                      >
                        View <ExternalLink className="h-3 w-3" />
                      </a>
                      <label className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer text-[11px]">
                        {mediaUploading["BIRTH_CERTIFICATE"] ? "Uploading..." : "Replace"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          className="hidden"
                          disabled={mediaUploading["BIRTH_CERTIFICATE"]}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleUploadDocument(f, "BIRTH_CERTIFICATE", "Birth Certificate");
                          }}
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="text-foundation-600 dark:text-emerald-400 hover:underline cursor-pointer text-[11px] font-medium">
                      {mediaUploading["BIRTH_CERTIFICATE"] ? "Uploading..." : "Upload"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        className="hidden"
                        disabled={mediaUploading["BIRTH_CERTIFICATE"]}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleUploadDocument(f, "BIRTH_CERTIFICATE", "Birth Certificate");
                        }}
                      />
                    </label>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Financial Status */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between transition-colors">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Monthly Contribution</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Foundation Setting
                </span>
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(member.monthly_contribution_amount)}
              </div>
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 flex items-center justify-between">
              <span>Source: Foundation Setting</span>
              <span>Obligatory rate</span>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 flex flex-col justify-between dark:border-emerald-900/40 dark:bg-emerald-950/30 transition-colors">
            <div>
              <span className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">Total Paid to Group</span>
              <div className="mt-1 text-2xl font-bold text-emerald-900 dark:text-emerald-400">
                {formatCurrency(ledger?.total_paid)}
              </div>
            </div>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-2">Credited to {member.group?.code}</span>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 flex flex-col justify-between dark:border-amber-900/40 dark:bg-amber-950/30 transition-colors">
            <div>
              <span className="text-xs text-amber-800 dark:text-amber-300 font-medium">Outstanding Dues</span>
              <div className="mt-1 text-2xl font-bold text-amber-900 dark:text-amber-400">
                {formatCurrency(ledger?.total_due)}
              </div>
            </div>
            <span className="text-[11px] text-amber-700 dark:text-amber-400 mt-2">Pending/Due records</span>
          </div>
        </div>
      </div>

      {/* Member Contribution Ledger Table */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Member Contribution Ledger</h3>

        <div className="table-container">
          <table className="table-custom">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Reference</th>
                <th>Status</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {!ledger?.entries || ledger.entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    No contribution records generated yet for this member.
                  </td>
                </tr>
              ) : (
                ledger.entries.map((e: any, idx: number) => (
                  <tr key={idx}>
                    <td className="text-xs text-slate-600">{formatDate(e.date)}</td>
                    <td className="font-medium text-xs text-slate-900">{e.description}</td>
                    <td className="font-mono text-xs text-slate-500">{e.reference || "-"}</td>
                    <td>
                      <StatusBadge status={e.status} />
                    </td>
                    <td
                      className={`text-right font-semibold text-xs ${
                        e.status === "PAID" ? "text-emerald-700" : "text-amber-700"
                      }`}
                    >
                      {formatCurrency(e.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
