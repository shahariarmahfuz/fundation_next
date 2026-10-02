"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import { Pagination } from "@/components/Pagination";
import {
  Scale,
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
  History
} from "lucide-react";

export default function QardHasanLedgerPage() {
  const [items, setItems] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    total_principal: "0.00",
    total_repaid: "0.00",
    total_outstanding: "0.00",
    total_count: 0,
    active_count: 0,
    completed_count: 0,
  });
  const [groups, setGroups] = useState<any[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);

  // Filter state
  const [selectedStatus, setSelectedStatus] = useState("");
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
      if (selectedStatus) params.append("status", selectedStatus);
      if (selectedGroup) params.append("group_id", selectedGroup);
      if (selectedBeneficiary) params.append("beneficiary_id", selectedBeneficiary);

      const res = await api.get(`/qard-hasan/ledger?${params.toString()}`);
      setItems(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.total_pages || 1);
      if (res.summary) setSummary(res.summary);
    } catch (err: any) {
      setError(err.message || "Failed to load Qard Hasan ledger.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [page, pageSize, selectedStatus, selectedGroup, selectedBeneficiary]);

  // Client-side quick search filtering on items
  const filteredItems = items.filter((item) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      item.qard_number?.toLowerCase().includes(term) ||
      item.beneficiary_name?.toLowerCase().includes(term) ||
      item.beneficiary_number?.toLowerCase().includes(term) ||
      item.funding_groups?.some((fg: string) => fg.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Scale className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            Qard Hasan Master Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Complete audit trail of all interest-free loans, multi-group allocations, and repayment histories
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/qard-hasan/new"
            className="btn-primary text-xs flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            New Qard Hasan
          </Link>
          <Link
            href="/admin/qard-hasan"
            className="btn-secondary text-xs"
          >
            Manage Loans
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Total Disbursed</span>
          <span className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono">
            {formatCurrency(summary.total_principal)}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">{summary.total_count} loans recorded</span>
        </div>

        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 p-3.5 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 block tracking-wider">Total Repaid</span>
          <span className="text-base font-bold text-emerald-700 dark:text-emerald-300 font-mono">
            {formatCurrency(summary.total_repaid)}
          </span>
          <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 block mt-0.5">Capital recovered</span>
        </div>

        <div className="rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/40 dark:bg-blue-950/20 p-3.5 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-blue-700 dark:text-blue-400 block tracking-wider">Outstanding</span>
          <span className="text-base font-bold text-blue-700 dark:text-blue-300 font-mono">
            {formatCurrency(summary.total_outstanding)}
          </span>
          <span className="text-[10px] text-blue-600/80 dark:text-blue-400/80 block mt-0.5">Active capital in field</span>
        </div>

        <div className="rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/20 p-3.5 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400 block tracking-wider">Active Loans</span>
          <span className="text-base font-bold text-amber-700 dark:text-amber-300 font-mono">
            {summary.active_count}
          </span>
          <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80 block mt-0.5">In repayment</span>
        </div>

        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 p-3.5 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 block tracking-wider">Settled Loans</span>
          <span className="text-base font-bold text-emerald-700 dark:text-emerald-300 font-mono">
            {summary.completed_count}
          </span>
          <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 block mt-0.5">100% returned</span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Interest Rate</span>
          <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
            Strictly 0%
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Shariah compliant</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by loan #, beneficiary name, or code..."
              className="input-field pl-9 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="input-field py-1 text-xs w-36"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="DEFAULTED">DEFAULTED</option>
            </select>

            {/* Group Filter */}
            <select
              value={selectedGroup}
              onChange={(e) => {
                setSelectedGroup(e.target.value);
                setPage(1);
              }}
              className="input-field py-1 text-xs w-44"
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
      </div>

      {/* Ledger Audit Table */}
      <div className="table-container">
        <table className="table-custom">
          <thead>
            <tr>
              <th>Loan Reference</th>
              <th>Date</th>
              <th>Beneficiary</th>
              <th>Funding Sources Breakdown</th>
              <th className="text-right">Principal</th>
              <th className="text-right">Total Repaid</th>
              <th className="text-right">Outstanding</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-600" />
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-slate-400">
                  No Qard Hasan loan records match your criteria.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  {/* Loan Reference */}
                  <td className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                    <Link
                      href={`/admin/qard-hasan/${item.id}`}
                      className="text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      {item.qard_number}
                    </Link>
                  </td>

                  {/* Date */}
                  <td className="text-xs text-slate-600 dark:text-slate-400">
                    {formatDate(item.disbursed_date)}
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

                  {/* Funding Sources Breakdown */}
                  <td>
                    {item.funding_allocations && item.funding_allocations.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {item.funding_allocations.map((fa: any) => (
                          <span
                            key={fa.id}
                            className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px] font-medium text-slate-700 dark:text-slate-300 font-mono"
                            title={`Allocated: ${formatCurrency(fa.allocated_amount)}, Repaid: ${formatCurrency(fa.repaid_amount)}, Outstanding: ${formatCurrency(fa.outstanding_amount)}`}
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

                  {/* Principal */}
                  <td className="text-right font-bold text-xs text-slate-900 dark:text-slate-100 font-mono">
                    {formatCurrency(item.principal_amount)}
                  </td>

                  {/* Total Repaid */}
                  <td className="text-right font-semibold text-xs text-emerald-700 dark:text-emerald-400 font-mono">
                    {formatCurrency(item.total_repaid)}
                  </td>

                  {/* Outstanding */}
                  <td className="text-right font-bold text-xs text-blue-700 dark:text-blue-400 font-mono">
                    {formatCurrency(item.outstanding_amount)}
                  </td>

                  {/* Status */}
                  <td>
                    <StatusBadge status={item.status} />
                  </td>

                  {/* Actions */}
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/admin/qard-hasan/${item.id}`}
                        className="btn-secondary !py-1 !px-2 text-xs"
                        title="View Loan Details"
                      >
                        Details
                      </Link>
                      {item.status === "ACTIVE" ? (
                        <Link
                          href={`/admin/qard-hasan/${item.id}/repay`}
                          className="btn-primary !py-1 !px-2.5 text-xs inline-flex items-center gap-1"
                        >
                          <Coins className="h-3 w-3" />
                          Repay
                        </Link>
                      ) : (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-end gap-0.5 px-2">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Settled
                        </span>
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
    </div>
  );
}
