"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, getStoredUser } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import { Pagination } from "@/components/Pagination";
import { Modal } from "@/components/Modal";
import {
  HandHeart,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldAlert
} from "lucide-react";

export default function ManageBeneficiariesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any | null>(null);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "warning"; message: string } | null>(null);

  // Edit Modal
  const [editingBeneficiary, setEditingBeneficiary] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState({
    code: "",
    name: "",
    phone: "",
    email: "",
    address: "",
    nid_or_id: "",
    status: "ACTIVE",
    notes: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Modal
  const [deletingBeneficiary, setDeletingBeneficiary] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const canCreate =
    user?.is_superuser ||
    user?.role?.name === "Super Admin" ||
    user?.role?.permissions?.some((p: any) => p.code === "beneficiaries.create");

  const canEdit =
    user?.is_superuser ||
    user?.role?.name === "Super Admin" ||
    user?.role?.permissions?.some((p: any) => p.code === "beneficiaries.update");

  const canDelete =
    user?.is_superuser ||
    user?.role?.name === "Super Admin" ||
    user?.role?.permissions?.some((p: any) => p.code === "beneficiaries.delete");

  const fetchBeneficiaries = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);

      const res = await api.get(`/beneficiaries?${params.toString()}`);
      setBeneficiaries(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err: any) {
      setError(err.message || "Failed to load beneficiaries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBeneficiaries();
  }, [page, pageSize, statusFilter]);

  // Check if ?action=new is in query string
  useEffect(() => {
    if (searchParams.get("action") === "new") {
      router.push("/admin/beneficiaries/new");
    }
  }, [searchParams, router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchBeneficiaries();
  };

  const openEditModal = (b: any) => {
    setEditingBeneficiary(b);
    setEditFormData({
      code: b.beneficiary_number || b.code || "",
      name: b.name || "",
      phone: b.phone || "",
      email: b.email || "",
      address: b.address || "",
      nid_or_id: b.nid_or_id || "",
      status: b.status || "ACTIVE",
      notes: b.notes || "",
    });
    setEditError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBeneficiary) return;
    setSavingEdit(true);
    setEditError(null);
    try {
      await api.put(`/beneficiaries/${editingBeneficiary.id}`, {
        ...editFormData,
        code: editFormData.code.trim() || undefined,
        beneficiary_number: editFormData.code.trim() || undefined,
      });
      setEditingBeneficiary(null);
      setNotification({
        type: "success",
        message: `Beneficiary ${editFormData.name} updated successfully!`,
      });
      setTimeout(() => setNotification(null), 5000);
      fetchBeneficiaries();
    } catch (err: any) {
      setEditError(err.message || "Failed to update beneficiary");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingBeneficiary) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/beneficiaries/${deletingBeneficiary.id}`);
      setDeletingBeneficiary(null);
      setNotification({
        type: res.archived ? "warning" : "success",
        message: res.message || "Beneficiary operation completed.",
      });
      setTimeout(() => setNotification(null), 6000);
      fetchBeneficiaries();
    } catch (err: any) {
      setError(err.message || "Failed to process beneficiary deletion");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Manage Beneficiaries
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            View, search, and manage welfare aid recipients, 0% Qard Hasan loans, and Sadakah assistance
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/beneficiaries/ledger"
            className="btn-secondary shrink-0 flex items-center gap-1.5"
          >
            <HandHeart className="h-4 w-4" />
            Beneficiary Ledger
          </Link>
          {canCreate && (
            <Link
              href="/admin/beneficiaries/new"
              className="btn-primary shrink-0 flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Add Beneficiary
            </Link>
          )}
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`flex items-center gap-3 rounded-xl border p-4 text-xs sm:text-sm ${
            notification.type === "warning"
              ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300"
              : "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
          }`}
        >
          {notification.type === "warning" ? (
            <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          ) : (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters & Search */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-3 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, beneficiary ID, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="input-field"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
            <button type="submit" className="btn-secondary">
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table-custom">
          <thead>
            <tr>
              <th>Beneficiary No.</th>
              <th>Full Name</th>
              <th>Phone</th>
              <th className="text-right">Qard Hasan Received</th>
              <th className="text-right">Outstanding Qard</th>
              <th className="text-right">Sadakah Received</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-600" />
                </td>
              </tr>
            ) : beneficiaries.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-400 dark:text-slate-500">
                  No beneficiaries found matching your search.
                </td>
              </tr>
            ) : (
              beneficiaries.map((b) => (
                <tr key={b.id}>
                  <td className="font-mono text-xs font-semibold text-slate-900 dark:text-white">
                    {b.beneficiary_number}
                  </td>
                  <td className="font-semibold text-slate-900 dark:text-slate-100">{b.name}</td>
                  <td className="text-xs text-slate-600 dark:text-slate-300">{b.phone}</td>
                  <td className="text-right text-xs font-medium text-slate-900 dark:text-slate-200">
                    {formatCurrency(b.total_qard_received)}
                  </td>
                  <td className="text-right text-xs font-semibold text-blue-700 dark:text-blue-400">
                    {formatCurrency(b.total_qard_outstanding)}
                  </td>
                  <td className="text-right text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(b.total_sadakah_received)}
                  </td>
                  <td>
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/admin/beneficiaries/${b.id}`}
                        className="inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors"
                        title="View Complete Assistance History"
                      >
                        <Eye className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="hidden xl:inline">History</span>
                      </Link>

                      {canEdit && (
                        <button
                          onClick={() => openEditModal(b)}
                          className="inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                          title="Edit Beneficiary"
                        >
                          <Edit className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                          <span className="hidden xl:inline">Edit</span>
                        </button>
                      )}

                      {canDelete && (
                        <button
                          onClick={() => setDeletingBeneficiary(b)}
                          className="inline-flex items-center gap-1 rounded bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 px-2 py-1 text-xs font-medium text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                          title="Archive or Delete Beneficiary"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
        onPageChange={(p) => setPage(p)}
        onPageSizeChange={(ps) => {
          setPageSize(ps);
          setPage(1);
        }}
      />

      {/* Modal: Edit Beneficiary */}
      {editingBeneficiary && (
        <Modal
          isOpen={!!editingBeneficiary}
          onClose={() => setEditingBeneficiary(null)}
          title={`Edit Beneficiary — ${editingBeneficiary.beneficiary_number}`}
          maxWidth="lg"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            {editError && (
              <div className="rounded-lg bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
                {editError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  required
                  type="text"
                  className="input-field"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Beneficiary Code (Format: B-XXXX)
                </label>
                <input
                  type="text"
                  className="input-field uppercase font-mono"
                  placeholder="e.g. B-0001"
                  value={editFormData.code}
                  onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value.toUpperCase() })}
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Must start with 'B-' prefix.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number *
                </label>
                <input
                  required
                  type="text"
                  className="input-field"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  className="input-field"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  NID / ID Number
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={editFormData.nid_or_id}
                  onChange={(e) => setEditFormData({ ...editFormData, nid_or_id: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Status *
                </label>
                <select
                  required
                  className="input-field"
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Residential Address
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Notes & Eligibility
              </label>
              <textarea
                rows={3}
                className="input-field"
                value={editFormData.notes}
                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingBeneficiary(null)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="btn-primary text-xs"
              >
                {savingEdit && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Delete / Archive Confirmation */}
      {deletingBeneficiary && (
        <Modal
          isOpen={!!deletingBeneficiary}
          onClose={() => setDeletingBeneficiary(null)}
          title="Confirm Beneficiary Deletion / Archival"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30 p-3 text-xs text-amber-800 dark:text-amber-300">
              <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Financial History Protection Policy:</p>
                <p>
                  If <strong>{deletingBeneficiary.name}</strong> has received 0% Qard Hasan loans or Sadakah grants, they will be <strong>safely archived and marked INACTIVE</strong> rather than hard deleted, preserving full financial assistance records.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to proceed with deleting or archiving beneficiary{" "}
              <strong>{deletingBeneficiary.beneficiary_number} ({deletingBeneficiary.name})</strong>?
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingBeneficiary(null)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="rounded-lg bg-rose-600 hover:bg-rose-700 px-3 py-2 text-xs font-semibold text-white transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirm Delete / Archive
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
