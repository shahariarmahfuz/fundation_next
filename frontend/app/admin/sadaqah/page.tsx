"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Pagination } from "@/components/Pagination";
import {
  Heart,
  Plus,
  Coins,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FolderTree,
  User,
  ArrowRight,
  Search,
  ExternalLink,
  BookOpen,
  ShieldCheck
} from "lucide-react";

export default function SadaqahManagePage() {
  const [grants, setGrants] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedBeneficiary, setSelectedBeneficiary] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRefs() {
      try {
        const [gRes, bRes] = await Promise.all([
          api.get("/groups"),
          api.get("/beneficiaries?page=1&page_size=200"),
        ]);
        setGroups(gRes || []);
        setBeneficiaries(bRes.items || []);
      } catch {}
    }
    loadRefs();
  }, []);

  const fetchGrants = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });
      if (selectedGroup) params.append("group_id", selectedGroup);
      if (selectedBeneficiary) params.append("beneficiary_id", selectedBeneficiary);
      if (search.trim()) params.append("search", search.trim());

      const res = await api.get(`/sadaqah?${params.toString()}`);
      setGrants(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.total_pages || 1);
    } catch (err: any) {
      setError(err.message || "Failed to load Sadaqah records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrants();
  }, [page, pageSize, selectedGroup, selectedBeneficiary]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchGrants();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Heart className="h-6 w-6 text-rose-600 dark:text-rose-400 fill-rose-100 dark:fill-rose-950/40" />
            Manage Sadaqah (Humanitarian Aid)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Non-repayable direct humanitarian disbursements to registered beneficiaries
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/sadaqah/ledger"
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <BookOpen className="h-4 w-4" />
            Sadaqah Ledger
          </Link>
          <Link
            href="/admin/sadaqah/new"
            className="btn-primary text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            New Sadaqah
          </Link>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 p-4 text-xs sm:text-sm text-rose-800 dark:text-rose-300">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by grant #, beneficiary, phone, or purpose..."
            className="input-field pl-9 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Group Filter */}
          <select
            value={selectedGroup}
            onChange={(e) => {
              setSelectedGroup(e.target.value);
              setPage(1);
            }}
            className="input-field py-1 text-xs w-48"
          >
            <option value="">All Funding Groups</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>

          {/* Beneficiary Filter */}
          <select
            value={selectedBeneficiary}
            onChange={(e) => {
              setSelectedBeneficiary(e.target.value);
              setPage(1);
            }}
            className="input-field py-1 text-xs w-48"
          >
            <option value="">All Beneficiaries</option>
            {beneficiaries.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.beneficiary_number})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grants Table */}
      <div className="table-container">
        <table className="table-custom">
          <thead>
            <tr>
              <th>Grant Reference</th>
              <th>Date</th>
              <th>Beneficiary</th>
              <th>Funding Sources</th>
              <th>Purpose / Relief</th>
              <th>Payment Method</th>
              <th>Voucher Ref</th>
              <th className="text-right">Amount (৳)</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-rose-600" />
                </td>
              </tr>
            ) : grants.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-slate-400">
                  No Sadaqah grant records found.
                </td>
              </tr>
            ) : (
              grants.map((g) => {
                const faCount = g.funding_allocations?.length || 0;
                return (
                  <tr key={g.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Grant Number */}
                    <td className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                      <Link
                        href={`/admin/sadaqah/${g.id}`}
                        className="text-rose-700 dark:text-rose-400 hover:underline"
                      >
                        {g.sadakah_number}
                      </Link>
                    </td>

                    {/* Date */}
                    <td className="text-xs text-slate-600 dark:text-slate-400">
                      {formatDate(g.disbursement_date)}
                    </td>

                    {/* Beneficiary */}
                    <td>
                      <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                        {g.beneficiary?.name}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-400">
                        {g.beneficiary?.phone || "No phone"} • {g.beneficiary?.beneficiary_number}
                      </div>
                    </td>

                    {/* Funding Sources */}
                    <td>
                      {faCount > 1 ? (
                        <div className="flex flex-wrap gap-1">
                          {g.funding_allocations.map((fa: any) => (
                            <span
                              key={fa.id}
                              className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-300 font-mono"
                              title={`${fa.group?.name}: ${formatCurrency(fa.allocated_amount)}`}
                            >
                              <FolderTree className="h-3 w-3 text-emerald-600" />
                              <span>{fa.group?.name || `Group #${fa.group_id}`}</span>
                            </span>
                          ))}
                        </div>
                      ) : g.funding_allocations && g.funding_allocations.length === 1 ? (
                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                          <FolderTree className="h-3 w-3 text-emerald-600" />
                          {g.funding_allocations[0].group?.name || g.group?.name || "Group"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                          <FolderTree className="h-3 w-3 text-emerald-600" />
                          {g.group?.name || "Group"}
                        </span>
                      )}
                    </td>

                    {/* Purpose / Description */}
                    <td className="text-xs text-slate-700 dark:text-slate-300 max-w-xs truncate" title={g.description}>
                      {g.description}
                    </td>

                    {/* Payment Method */}
                    <td className="font-mono text-xs text-slate-600 dark:text-slate-400">
                      {g.payment_method}
                    </td>

                    {/* Voucher Ref */}
                    <td className="font-mono text-xs text-slate-500 dark:text-slate-400">
                      {g.reference || "—"}
                    </td>

                    {/* Amount */}
                    <td className="text-right font-bold text-xs text-rose-700 dark:text-rose-400 font-mono">
                      {formatCurrency(g.amount)}
                    </td>

                    {/* Actions */}
                    <td className="text-right">
                      <Link
                        href={`/admin/sadaqah/${g.id}`}
                        className="btn-secondary !py-1 !px-2.5 text-xs inline-flex items-center gap-1"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                );
              })
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
    </div>
  );
}
