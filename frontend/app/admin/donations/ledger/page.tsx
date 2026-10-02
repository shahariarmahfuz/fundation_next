"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Pagination } from "@/components/Pagination";
import {
  Gift,
  HeartHandshake,
  Users,
  FolderTree,
  ArrowLeft,
  Calendar,
  Filter,
  Download,
  Printer,
  Loader2,
  AlertCircle,
  Coins,
  Receipt
} from "lucide-react";

export default function DonationsLedgerPage() {
  const [donations, setDonations] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [sourceTypeFilter, setSourceTypeFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = async () => {
    try {
      const g = await api.get("/groups");
      setGroups(g || []);
    } catch {}
  };

  const fetchLedger = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });
      if (selectedGroup) params.append("group_id", selectedGroup);
      if (sourceTypeFilter) params.append("source_type", sourceTypeFilter);

      const res = await api.get(`/donations?${params.toString()}`);
      setDonations(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.total_pages || 1);
    } catch (err: any) {
      setError(err.message || "Failed to load donations ledger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    fetchLedger();
  }, [page, pageSize, selectedGroup, sourceTypeFilter]);

  const handlePrint = () => {
    window.print();
  };

  const totalPageAmount = donations.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/donations"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Donations Ledger
              </h1>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                {total} Transactions
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Chronological accounting journal of all philanthropic donations received across foundation groups
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="btn-secondary text-xs"
          >
            <Printer className="h-4 w-4" />
            Print Ledger
          </button>
          <Link
            href="/admin/donations/new"
            className="btn-primary text-xs"
          >
            <Gift className="h-4 w-4" />
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
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <Filter className="h-4 w-4 text-emerald-600" />
          <span>Filter Ledger:</span>
        </div>

        <select
          className="input-field text-xs w-44"
          value={sourceTypeFilter}
          onChange={(e) => {
            setSourceTypeFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Source Types</option>
          <option value="DONOR">External Donors</option>
          <option value="MEMBER">Foundation Members</option>
        </select>

        <select
          className="input-field text-xs w-48"
          value={selectedGroup}
          onChange={(e) => {
            setSelectedGroup(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Accounting Groups</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.code} — {g.name}
            </option>
          ))}
        </select>

        <div className="ml-auto text-xs font-semibold text-slate-700 dark:text-slate-300">
          Page Inflow Total: <strong className="text-emerald-700 dark:text-emerald-400">{formatCurrency(totalPageAmount)}</strong>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="table-container">
        <table className="table-custom">
          <thead>
            <tr>
              <th>Date</th>
              <th>Receipt / TXN #</th>
              <th>Source Type</th>
              <th>Contributor</th>
              <th>Credited Accounting Group</th>
              <th>Method</th>
              <th>Reference / Notes</th>
              <th className="text-right">Credit Inflow</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-600" />
                  <span className="mt-2 block text-xs text-slate-400">Loading donations ledger...</span>
                </td>
              </tr>
            ) : donations.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                  No donation transactions found for the selected filters.
                </td>
              </tr>
            ) : (
              donations.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="text-xs font-medium">
                    {formatDate(d.donation_date)}
                  </td>
                  <td>
                    <span className="font-mono text-xs font-semibold text-slate-900 dark:text-white">
                      {d.donation_number}
                    </span>
                  </td>
                  <td>
                    {d.source_type === "MEMBER" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                        <Users className="h-3 w-3" />
                        Member
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <HeartHandshake className="h-3 w-3" />
                        Donor
                      </span>
                    )}
                  </td>
                  <td>
                    {d.source_type === "MEMBER" ? (
                      d.member ? (
                        <Link
                          href={`/admin/members/${d.member.id}`}
                          className="group block text-xs"
                        >
                          <div className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                            {d.member.full_name}
                          </div>
                          <div className="font-mono text-[11px] text-slate-500">
                            {d.member.member_number}
                          </div>
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-500">Member #{d.member_id}</span>
                      )
                    ) : d.donor ? (
                      <Link
                        href={`/admin/donors/${d.donor.id}`}
                        className="group block text-xs"
                      >
                        <div className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                          {d.donor.name}
                        </div>
                        <div className="font-mono text-[11px] text-slate-500">
                          {d.donor.donor_number}
                        </div>
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-500">External Donor</span>
                    )}
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
                    <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {d.payment_method?.replace("_", " ")}
                    </span>
                  </td>
                  <td className="text-xs text-slate-500 dark:text-slate-400">
                    {d.reference || d.notes || "—"}
                  </td>
                  <td className="text-right">
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm">
                      +{formatCurrency(d.amount)}
                    </span>
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
    </div>
  );
}
