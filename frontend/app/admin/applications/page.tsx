"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import { Modal } from "@/components/Modal";
import { Pagination } from "@/components/Pagination";
import {
  UserCheck,
  Filter,
  CheckCircle,
  XCircle,
  Eye,
  FolderTree,
  Loader2,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  FileText,
  Clock
} from "lucide-react";

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [reviewAction, setReviewAction] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [assignedGroupId, setAssignedGroupId] = useState<string>("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

  // Fetch groups
  useEffect(() => {
    const loadGroups = async () => {
      try {
        const data = await api.get("/groups");
        setGroups(data);
        if (data.length > 0) {
          setAssignedGroupId(data[0].id.toString());
        }
      } catch (err) {
        console.error("Failed to load groups", err);
      }
    };
    loadGroups();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: "25",
      });
      if (statusFilter) params.append("status", statusFilter);

      const data = await api.get(`/member-applications?${params.toString()}`);
      setApplications(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (err: any) {
      setError(err.message || "Failed to load member applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [page, statusFilter]);

  const handleOpenReview = (app: any) => {
    setSelectedApp(app);
    setReviewAction("APPROVE");
    setReviewNotes("");
    setReviewError(null);
    if (groups.length > 0) {
      setAssignedGroupId(groups[0].id.toString());
    }
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    if (reviewAction === "APPROVE" && !assignedGroupId) {
      setReviewError("You must assign the applicant to an Accounting Group");
      return;
    }

    setSubmittingReview(true);
    setReviewError(null);

    try {
      await api.post(`/member-applications/${selectedApp.id}/review`, {
        action: reviewAction,
        assigned_group_id: reviewAction === "APPROVE" ? Number(assignedGroupId) : undefined,
        review_notes: reviewNotes.trim() || undefined,
      });

      setReviewSuccess(
        reviewAction === "APPROVE"
          ? `Application approved! Applicant has been enrolled as an active Member in the assigned group.`
          : `Application rejected.`
      );
      setReviewModalOpen(false);
      setTimeout(() => setReviewSuccess(null), 5000);
      fetchApplications();
    } catch (err: any) {
      setReviewError(err.message || "Failed to process review");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Public Member Applications
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Review online membership submissions and assign approved members to accounting groups
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/apply"
            target="_blank"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <UserCheck className="h-4 w-4" />
            View Public Form
          </Link>
        </div>
      </div>

      {reviewSuccess && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300">
          <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>{reviewSuccess}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Filter Status:</span>
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
            <button
              onClick={() => {
                setStatusFilter("");
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === "" ? "bg-white text-emerald-700 shadow-sm dark:bg-slate-900 dark:text-emerald-400" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                setStatusFilter("PENDING");
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === "PENDING" ? "bg-white text-amber-700 shadow-sm dark:bg-slate-900 dark:text-amber-400" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => {
                setStatusFilter("APPROVED");
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === "APPROVED" ? "bg-white text-emerald-700 shadow-sm dark:bg-slate-900 dark:text-emerald-400" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => {
                setStatusFilter("REJECTED");
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === "REJECTED" ? "bg-white text-rose-700 shadow-sm dark:bg-slate-900 dark:text-rose-400" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Rejected
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Total Applications: {total}
        </div>
      </div>

      {/* Applications Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3 font-semibold">Applicant</th>
                <th className="px-6 py-3 font-semibold">Contact Info</th>
                <th className="px-6 py-3 font-semibold">National ID / NID</th>
                <th className="px-6 py-3 font-semibold text-right">Proposed Monthly</th>
                <th className="px-6 py-3 font-semibold text-center">Status</th>
                <th className="px-6 py-3 font-semibold">Applied Date</th>
                <th className="px-6 py-3 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-600" />
                    <span className="mt-2 block text-xs text-slate-500 dark:text-slate-400">Loading applications...</span>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-6 py-6 text-center text-rose-600 dark:text-rose-400">
                    {error}
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400 dark:text-slate-500">
                    No membership applications found matching criteria.
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">{app.applicant_name}</div>
                      <div className="text-xs text-slate-400 dark:text-slate-500">App #{app.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-800 dark:text-slate-200">{app.email}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{app.phone}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                      {app.nid_or_id || "Not Provided"}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-700 dark:text-emerald-400">
                      {formatCurrency(app.proposed_contribution)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {formatDate(app.created_at)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleOpenReview(app)}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                          app.status === "PENDING"
                            ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        }`}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        {app.status === "PENDING" ? "Review & Assign" : "Details"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={25}
          onPageChange={setPage}
        />
      </div>

      {/* Application Review Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title={`Application Review — ${selectedApp?.applicant_name || ""}`}
        maxWidth="lg"
      >
        {selectedApp && (
          <form onSubmit={handleSubmitReview} className="space-y-4">
            {/* Applicant Summary */}
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 text-sm space-y-2 dark:bg-slate-950/60 dark:border-slate-800">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">Email Address:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedApp.email}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">Phone Number:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedApp.phone}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">National ID (NID):</span>
                  <span className="font-mono text-slate-900 dark:text-slate-200">{selectedApp.nid_or_id || "None"}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">Proposed Contribution:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(selectedApp.proposed_contribution)} / month
                  </span>
                </div>
              </div>

              {selectedApp.address && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">Residential Address:</span>
                  <span className="text-slate-800 dark:text-slate-200">{selectedApp.address}</span>
                </div>
              )}

              {selectedApp.reason_for_joining && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">Statement / Reason for Joining:</span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 italic mt-0.5">
                    "{selectedApp.reason_for_joining}"
                  </p>
                </div>
              )}
            </div>

            {/* Current Application Status Details */}
            {selectedApp.status !== "PENDING" ? (
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Application Resolution:</span>
                  <StatusBadge status={selectedApp.status} />
                </div>
                {selectedApp.review_notes && (
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    <strong>Admin Notes:</strong> {selectedApp.review_notes}
                  </div>
                )}
                {selectedApp.status === "APPROVED" && selectedApp.created_member_id && (
                  <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                    Enrolled as Member ID #{selectedApp.created_member_id}.
                  </div>
                )}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setReviewModalOpen(false)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Close Details
                  </button>
                </div>
              </div>
            ) : (
              /* Review Actions Form */
              <div className="space-y-4 pt-2">
                {reviewError && (
                  <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300">
                    {reviewError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                    Review Decision *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setReviewAction("APPROVE")}
                      className={`flex items-center justify-center gap-2 rounded-xl p-3 border text-sm font-semibold transition-all ${
                        reviewAction === "APPROVE"
                          ? "border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500 dark:border-emerald-500 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-400"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      }`}
                    >
                      <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      Approve & Enroll Member
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewAction("REJECT")}
                      className={`flex items-center justify-center gap-2 rounded-xl p-3 border text-sm font-semibold transition-all ${
                        reviewAction === "REJECT"
                          ? "border-rose-600 bg-rose-50 text-rose-800 ring-2 ring-rose-500 dark:border-rose-500 dark:bg-rose-950/50 dark:text-rose-300 dark:ring-rose-400"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      }`}
                    >
                      <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                      Reject Application
                    </button>
                  </div>
                </div>

                {reviewAction === "APPROVE" && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Assigned Accounting Group *
                    </label>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                      Fundamental rule: Every active member must belong to exactly one accounting group. Their future contributions will strictly fund this group.
                    </p>
                    <select
                      required
                      value={assignedGroupId}
                      onChange={(e) => setAssignedGroupId(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
                    >
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          [{g.code}] {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Review Remarks / Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="e.g. Identity verified via national registry; passed background screening..."
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setReviewModalOpen(false)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className={`inline-flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-medium text-white transition-colors ${
                      reviewAction === "APPROVE"
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-rose-600 hover:bg-rose-700"
                    }`}
                  >
                    {submittingReview && <Loader2 className="h-4 w-4 animate-spin" />}
                    Confirm {reviewAction === "APPROVE" ? "Enrollment" : "Rejection"}
                  </button>
                </div>
              </div>
            )}
          </form>
        )}
      </Modal>
    </div>
  );
}
