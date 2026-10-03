"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Pagination } from "@/components/Pagination";
import { CustomSelect } from "@/components/ui/custom-select";
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
  Filter,
  FileSpreadsheet,
  ExternalLink,
  ShieldCheck,
  Building2
} from "lucide-react";

export default function SadaqahLedgerPage() {
  const [items, setItems] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    total_amount: "0.00",
    total_count: 0,
    beneficiary_count: 0,
  });
  const [groups, setGroups] = useState<any[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);

  // Filter state
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedBeneficiary, setSelectedBeneficiary] = useState("");
  const [search, setSearch] = useState("");

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load dropdown reference options
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

  // Fetch Ledger data
  const fetchLedger = async () => {
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

      const res = await api.get(`/sadaqah/ledger?${params.toString()}`);
      setItems(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.total_pages || 1);
      if (res.summary) setSummary(res.summary);
    } catch (err: any) {
      setError(err.message || "Failed to load Sadaqah ledger.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [page, pageSize, selectedGroup, selectedBeneficiary]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchLedger();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Heart className="h-6 w-6 text-rose-600 dark:text-rose-400 fill-rose-100 dark:fill-rose-950/40" />
            Sadaqah Central Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Audit trail of non-repayable humanitarian assistance, group funding debits, and recipient distributions
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-2 w-full sm:w-auto shrink-0">
          <Link
            href="/admin/sadaqah/new"
            className="w-full sm:w-auto btn-primary text-xs sm:text-sm flex items-center justify-center gap-1.5 whitespace-nowrap min-h-[44px] sm:min-h-0 py-2.5 sm:py-2 px-4"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span>New Sadaqah</span>
          </Link>
          <Link
            href="/admin/sadaqah"
            className="w-full sm:w-auto btn-secondary text-xs sm:text-sm flex items-center justify-center gap-1.5 whitespace-nowrap min-h-[44px] sm:min-h-0 py-2.5 sm:py-2 px-4"
          >
            <span>Manage Sadaqah</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 p-4 text-xs sm:text-sm text-rose-800 dark:text-rose-300">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Total Sadaqah Disbursed</span>
          <span className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono">
            {formatCurrency(summary.total_amount)}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Permanent relief assistance</span>
        </div>

        <div className="rounded-xl border border-rose-200 dark:border-rose-800/60 bg-rose-50/40 dark:bg-rose-950/20 p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-rose-700 dark:text-rose-400 block tracking-wider">Total Grants</span>
          <span className="text-lg font-bold text-rose-700 dark:text-rose-300 font-mono">
            {summary.total_count}
          </span>
          <span className="text-[10px] text-rose-600/80 dark:text-rose-400/80 block mt-0.5">Disbursement records</span>
        </div>

        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 block tracking-wider">Beneficiaries Assisted</span>
          <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300 font-mono">
            {summary.beneficiary_count}
          </span>
          <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 block mt-0.5">Distinct recipients</span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Grant Nature</span>
          <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4" />
            100% Non-Repayable
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">No receivables created</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by grant #, beneficiary name, code, purpose, or ref..."
              className="input-field pl-9 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Group Filter */}
            <div className="w-48">
              <CustomSelect
                value={selectedGroup}
                onChange={(val) => {
                  setSelectedGroup(String(val));
                  setPage(1);
                }}
                options={[
                  { value: "", label: "All Funding Groups" },
                  ...groups.map((g) => ({
                    value: String(g.id),
                    label: g.name,
                  })),
                ]}
                searchable={true}
                searchPlaceholder="Search groups..."
              />
            </div>

            {/* Beneficiary Filter */}
            <div className="w-48">
              <CustomSelect
                value={selectedBeneficiary}
                onChange={(val) => {
                  setSelectedBeneficiary(String(val));
                  setPage(1);
                }}
                options={[
                  { value: "", label: "All Beneficiaries" },
                  ...beneficiaries.map((b) => ({
                    value: String(b.id),
                    label: b.name,
                    sublabel: b.beneficiary_number,
                  })),
                ]}
                searchable={true}
                searchPlaceholder="Search beneficiaries..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Ledger Audit Table */}
      <div className="table-container">
        <table className="table-custom">
          <thead>
            <tr>
              <th>Date</th>
              <th>Grant Reference</th>
              <th>Beneficiary</th>
              <th>Funding Group(s) Breakdown</th>
              <th>Purpose / Relief</th>
              <th>Method</th>
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
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-slate-400">
                  No Sadaqah grant records found.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  {/* Date */}
                  <td className="text-xs text-slate-600 dark:text-slate-400">
                    {formatDate(item.disbursement_date)}
                  </td>

                  {/* Grant Reference */}
                  <td className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                    <Link
                      href={`/admin/sadaqah/${item.id}`}
                      className="text-rose-700 dark:text-rose-400 hover:underline flex items-center gap-1"
                    >
                      {item.sadakah_number}
                    </Link>
                  </td>

                  {/* Beneficiary */}
                  <td>
                    <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                      {item.beneficiary_name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {item.beneficiary_number}
                    </div>
                  </td>

                  {/* Funding Groups Breakdown */}
                  <td>
                    {item.funding_allocations && item.funding_allocations.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {item.funding_allocations.map((fa: any) => (
                          <span
                            key={fa.id}
                            className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px] font-medium text-slate-700 dark:text-slate-300 font-mono"
                            title={`Contributed: ${formatCurrency(fa.allocated_amount)}`}
                          >
                            <FolderTree className="h-3 w-3 text-emerald-600" />
                            <span>{fa.group?.name || `Group #${fa.group_id}`}:</span>
                            <strong className="text-slate-900 dark:text-slate-100">
                              {formatCurrency(fa.allocated_amount)}
                            </strong>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">
                        {item.funding_groups?.join(", ") || "—"}
                      </span>
                    )}
                  </td>

                  {/* Purpose */}
                  <td className="text-xs text-slate-700 dark:text-slate-300 max-w-xs truncate" title={item.description}>
                    {item.description}
                  </td>

                  {/* Payment Method */}
                  <td className="font-mono text-xs text-slate-600 dark:text-slate-400">
                    {item.payment_method}
                  </td>

                  {/* Voucher Ref */}
                  <td className="font-mono text-xs text-slate-500 dark:text-slate-400">
                    {item.reference || "—"}
                  </td>

                  {/* Amount */}
                  <td className="text-right font-bold text-xs text-rose-700 dark:text-rose-400 font-mono">
                    {formatCurrency(item.amount)}
                  </td>

                  {/* Action */}
                  <td className="text-right">
                    <Link
                      href={`/admin/sadaqah/${item.id}`}
                      className="btn-secondary !py-1 !px-2.5 text-xs inline-flex items-center gap-1"
                    >
                      Details
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
    </div>
  );
}
