"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import { Pagination } from "@/components/Pagination";
import { Modal } from "@/components/Modal";
import {
  HandHeart,
  Plus,
  Search,
  Eye,
  Loader2,
  AlertCircle
} from "lucide-react";

export default function BeneficiariesPage() {
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    nid_or_id: "",
    status: "ACTIVE",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchBeneficiaries = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });
      if (search) params.append("search", search);

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
  }, [page, pageSize]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchBeneficiaries();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.post("/beneficiaries", formData);
      setIsModalOpen(false);
      setFormData({
        name: "",
        phone: "",
        email: "",
        address: "",
        nid_or_id: "",
        status: "ACTIVE",
        notes: "",
      });
      fetchBeneficiaries();
    } catch (err: any) {
      setSubmitError(err.message || "Failed to register beneficiary");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Beneficiaries Directory</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Recipients of interest-free Qard Hasan loans and Sadakah welfare grants
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          <Plus className="h-4 w-4" />
          Register Beneficiary
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-800">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Search */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by beneficiary name, ID, or phone..."
              className="input-field pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-secondary">
            Search
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table-custom">
          <thead>
            <tr>
              <th>ID Number</th>
              <th>Full Name</th>
              <th>Phone</th>
              <th className="text-right">Qard Loans Received</th>
              <th className="text-right">Qard Outstanding</th>
              <th className="text-right">Sadakah Aid Received</th>
              <th>Status</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-foundation-700" />
                </td>
              </tr>
            ) : beneficiaries.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-400">
                  No beneficiaries found.
                </td>
              </tr>
            ) : (
              beneficiaries.map((b) => (
                <tr key={b.id}>
                  <td className="font-mono text-xs font-semibold text-slate-900">
                    {b.beneficiary_number}
                  </td>
                  <td className="font-semibold text-slate-900">{b.name}</td>
                  <td className="text-xs text-slate-600">{b.phone}</td>
                  <td className="text-right font-medium text-xs text-slate-800">
                    {formatCurrency(b.total_qard_received)}
                  </td>
                  <td className="text-right font-bold text-xs text-blue-700">
                    {formatCurrency(b.total_qard_outstanding)}
                  </td>
                  <td className="text-right font-bold text-xs text-purple-700">
                    {formatCurrency(b.total_sadakah_received)}
                  </td>
                  <td>
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="text-right">
                    <Link
                      href={`/admin/beneficiaries/${b.id}`}
                      className="inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-foundation-50 px-2.5 py-1 text-xs font-medium text-foundation-800 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Assistance History
                    </Link>
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

      {/* Modal: Register Beneficiary */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register Beneficiary"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {submitError && (
            <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              {submitError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              required
              type="text"
              className="input-field"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Phone Number <span className="text-rose-500">*</span>
            </label>
            <input
              required
              type="tel"
              className="input-field"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              NID or ID Number
            </label>
            <input
              type="text"
              className="input-field"
              value={formData.nid_or_id}
              onChange={(e) => setFormData({ ...formData, nid_or_id: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
            <input
              type="text"
              className="input-field"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
            <textarea
              rows={2}
              className="input-field"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Beneficiary
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
