"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api, getStoredUser } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import { Pagination } from "@/components/Pagination";
import { CustomSelect } from "@/components/ui/custom-select";
import { Modal } from "@/components/Modal";
import {
  HeartHandshake,
  PlusCircle,
  Search,
  Filter,
  Eye,
  Pencil,
  Trash2,
  Phone,
  Mail,
  Coins,
  Receipt,
  Loader2,
  AlertCircle,
  ShieldAlert,
  ArrowRight
} from "lucide-react";

export default function ManageDonorsPage() {
  const [donors, setDonors] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delete / Archive Modal
  const [deletingDonor, setDeletingDonor] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);

  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const canCreate =
    user?.is_superuser ||
    user?.role?.name === "Super Admin" ||
    user?.role?.permissions?.some((p: any) => p.code === "donors.create");

  const fetchDonors = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);

      const res = await api.get(`/donors?${params.toString()}`);
      setDonors(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err: any) {
      setError(err.message || "Failed to load donors list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonors();
  }, [page, pageSize, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchDonors();
  };

  const handleConfirmDelete = async () => {
    if (!deletingDonor) return;
    setDeleting(true);
    setDeleteMessage(null);
    try {
      const res = await api.delete(`/donors/${deletingDonor.id}`);
      setDeleteMessage(res.message || "Donor removed or archived successfully.");
      setTimeout(() => {
        setDeletingDonor(null);
        setDeleteMessage(null);
        fetchDonors();
      }, 1500);
    } catch (err: any) {
      alert(err.message || "Failed to delete/archive donor");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Manage Donors
            </h1>
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
              {total} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Registered philanthropic donors, historical contribution totals, and dedicated ledgers
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canCreate && (
            <Link href="/admin/donors/new" className="btn-primary text-xs">
              <PlusCircle className="h-4 w-4" />
              Add Donor
            </Link>
          )}
          <Link href="/admin/donations/new" className="btn-secondary text-xs">
            <HeartHandshake className="h-4 w-4 text-emerald-600" />
            Record Donation
          </Link>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/30 p-4 text-xs sm:text-sm text-rose-800 dark:text-rose-300">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, donor ID, phone, email, address..."
            className="input-field pl-9 text-xs sm:text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <div className="w-40">
            <CustomSelect
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(String(val));
                setPage(1);
              }}
              options={[
                { value: "", label: "All Statuses" },
                { value: "ACTIVE", label: "ACTIVE" },
                { value: "INACTIVE", label: "INACTIVE" },
              ]}
              searchable={false}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table-custom">
          <thead>
            <tr>
              <th>Donor</th>
              <th>Contact Details</th>
              <th>Total Donated</th>
              <th>Donations</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-600" />
                  <span className="mt-2 block text-xs text-slate-400">Loading donors...</span>
                </td>
              </tr>
            ) : donors.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                  No donors found matching criteria.
                </td>
              </tr>
            ) : (
              donors.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td>
                    <Link
                      href={`/admin/donors/${d.id}`}
                      className="group block"
                    >
                      <div className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                        {d.name}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {d.donor_number}
                      </div>
                    </Link>
                  </td>
                  <td>
                    <div className="space-y-0.5 text-xs">
                      {d.phone ? (
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <Phone className="h-3 w-3 text-slate-400" />
                          <span>{d.phone}</span>
                        </div>
                      ) : null}
                      {d.email ? (
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
                          <Mail className="h-3 w-3 text-slate-400" />
                          <span>{d.email}</span>
                        </div>
                      ) : null}
                      {!d.phone && !d.email && (
                        <span className="text-slate-400 text-xs italic">No contact info</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                      {formatCurrency(d.total_donations || 0)}
                    </div>
                  </td>
                  <td>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {d.donation_count || 0} gift(s)
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/admin/donors/${d.id}`}
                        className="rounded p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                        title="View Donor Ledger"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>

                      <Link
                        href={`/admin/donors/${d.id}/edit`}
                        className="rounded p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                        title="Edit Donor (Dedicated Page)"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>

                      <button
                        onClick={() => setDeletingDonor(d)}
                        className="rounded p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 transition-colors"
                        title="Delete / Archive Donor"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        onPageChange={(p) => setPage(p)}
        onPageSizeChange={(ps) => {
          setPageSize(ps);
          setPage(1);
        }}
      />

      {/* Modal: Delete / Archive Confirmation */}
      {deletingDonor && (
        <Modal
          isOpen={!!deletingDonor}
          onClose={() => {
            if (!deleting) setDeletingDonor(null);
          }}
          title="Confirm Donor Deletion / Archival"
          maxWidth="md"
        >
          <div className="space-y-4">
            {deleteMessage ? (
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-4 text-xs sm:text-sm text-emerald-800 dark:text-emerald-300">
                {deleteMessage}
              </div>
            ) : (
              <>
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30 p-3 text-xs text-amber-800 dark:text-amber-300">
                  <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-1">Financial Integrity Protection Policy:</p>
                    <p>
                      If <strong>{deletingDonor.name}</strong> ({deletingDonor.donor_number}) has any recorded donations in the foundation ledger, they will be <strong>safely archived and marked INACTIVE</strong> rather than deleted, preserving accounting records and group balances.
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Are you sure you want to proceed with removing or archiving this donor?
                </p>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={() => setDeletingDonor(null)}
                    className="btn-secondary text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={handleConfirmDelete}
                    className="btn-danger text-xs"
                  >
                    {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Confirm Archive / Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
