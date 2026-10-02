"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import { Pagination } from "@/components/Pagination";
import {
  HeartHandshake,
  ArrowLeft,
  Pencil,
  PlusCircle,
  Coins,
  Receipt,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Loader2,
  AlertCircle,
  FolderTree
} from "lucide-react";

export default function DonorProfilePage() {
  const params = useParams();
  const donorId = params.id as string;

  const [donor, setDonor] = useState<any | null>(null);
  const [donations, setDonations] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [loading, setLoading] = useState(true);
  const [donationsLoading, setDonationsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDonor = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get(`/donors/${donorId}`);
      setDonor(data);
    } catch (err: any) {
      setError(err.message || "Failed to load donor profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchDonations = async () => {
    setDonationsLoading(true);
    try {
      const res = await api.get(`/donors/${donorId}/donations?page=${page}&page_size=${pageSize}`);
      setDonations(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err: any) {
      console.error(err);
    } finally {
      setDonationsLoading(false);
    }
  };

  useEffect(() => {
    if (donorId) {
      fetchDonor();
    }
  }, [donorId]);

  useEffect(() => {
    if (donorId) {
      fetchDonations();
    }
  }, [donorId, page, pageSize]);

  if (loading && !donor) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error || !donor) {
    return (
      <div className="space-y-4">
        <Link href="/admin/donors" className="btn-secondary text-xs">
          <ArrowLeft className="h-4 w-4" />
          Back to Donors
        </Link>
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/30 p-6 text-rose-800 dark:text-rose-300">
          {error || "Donor not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/donors"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {donor.name}
              </h1>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                {donor.donor_number}
              </span>
              <StatusBadge status={donor.status} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Registered since {formatDate(donor.created_at)} • Official philanthropic donor ledger
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/admin/donors/${donorId}/edit`}
            className="btn-secondary text-xs"
          >
            <Pencil className="h-4 w-4" />
            Edit Donor
          </Link>
          <Link
            href={`/admin/donations/new?donor_id=${donorId}`}
            className="btn-primary text-xs"
          >
            <PlusCircle className="h-4 w-4" />
            Record Donation
          </Link>
        </div>
      </div>

      {/* Donor Snapshot Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <Coins className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Lifetime Donated
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(donor.total_donations || 0)}
          </div>
          <span className="text-[11px] text-slate-400">Cumulative total across groups</span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <Receipt className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            Donations Recorded
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            {donor.donation_count || 0}
          </div>
          <span className="text-[11px] text-slate-400">Confirmed transactions</span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:col-span-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Contact & Address Details
          </div>
          <div className="space-y-1.5 text-xs">
            {donor.phone && (
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{donor.phone}</span>
              </div>
            )}
            {donor.email && (
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{donor.email}</span>
              </div>
            )}
            {donor.address && (
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{donor.address}</span>
              </div>
            )}
            {!donor.phone && !donor.email && !donor.address && (
              <span className="text-slate-400 italic">No contact details on file</span>
            )}
          </div>
        </div>
      </div>

      {donor.notes && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300">Notes & Philanthropy Preferences: </span>
          <span className="text-slate-600 dark:text-slate-400">{donor.notes}</span>
        </div>
      )}

      {/* Donation Ledger Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HeartHandshake className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Chronological Donation Ledger
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {total} Record(s) Found
          </span>
        </div>

        <div className="table-container">
          <table className="table-custom">
            <thead>
              <tr>
                <th>Date</th>
                <th>Donation #</th>
                <th>Credited Group</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              {donationsLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-600" />
                    <span className="mt-2 block text-xs text-slate-400">Loading ledger records...</span>
                  </td>
                </tr>
              ) : donations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                    No donation records found for this donor.
                  </td>
                </tr>
              ) : (
                donations.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="text-xs">
                      {formatDate(d.donation_date)}
                    </td>
                    <td>
                      <span className="font-mono text-xs font-semibold text-slate-900 dark:text-white">
                        {d.donation_number}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-xs">
                        <FolderTree className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {d.group?.name}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          ({d.group?.code})
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm">
                        {formatCurrency(d.amount)}
                      </span>
                    </td>
                    <td>
                      <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {d.payment_method?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="text-xs text-slate-500 dark:text-slate-400">
                      {d.reference || d.notes || "—"}
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
          pageSize={pageSize}
          onPageChange={(p) => setPage(p)}
          onPageSizeChange={(ps) => {
            setPageSize(ps);
            setPage(1);
          }}
        />
      </div>
    </div>
  );
}
