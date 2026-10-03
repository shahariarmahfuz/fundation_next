"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import { Pagination } from "@/components/Pagination";
import { CustomSelect } from "@/components/ui/custom-select";
import {
  Scale,
  Plus,
  Coins,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FolderTree,
  User,
  Search,
  BookOpen,
  RotateCcw
} from "lucide-react";

export default function QardHasanPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedBeneficiary, setSelectedBeneficiary] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load groups and beneficiaries for filtering
  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const [gRes, bRes] = await Promise.allSettled([
          api.get("/groups"),
          api.get("/beneficiaries?page=1&page_size=200"),
        ]);
        if (gRes.status === "fulfilled") {
          const gData = gRes.value;
          setGroups(Array.isArray(gData) ? gData : gData?.items || []);
        }
        if (bRes.status === "fulfilled") {
          const bData = bRes.value;
          setBeneficiaries(bData?.items || (Array.isArray(bData) ? bData : []));
        }
      } catch (e) {
        console.error("Failed to load filter options", e);
      }
    }
    loadFilterOptions();
  }, []);

  const fetchLoans = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });
      if (selectedGroup) params.append("group_id", selectedGroup);
      if (selectedBeneficiary) params.append("beneficiary_id", selectedBeneficiary);
      if (selectedStatus) params.append("status", selectedStatus);
      if (search.trim()) params.append("search", search.trim());

      const res = await api.get(`/qard-hasan?${params.toString()}`);
      setLoans(res?.items || []);
      setTotal(res?.total || 0);
      setTotalPages(res?.total_pages || 1);
    } catch (err: any) {
      setError(err?.message || "Unable to load Qard Hasan data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, [page, pageSize, selectedGroup, selectedBeneficiary, selectedStatus]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchLoans();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Scale className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            Qard Hasan (Interest-Free Loans)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Shariah-compliant interest-free financing (0% Interest) with revolving group returns
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/qard-hasan/ledger"
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <BookOpen className="h-4 w-4" />
            Qard Hasan Ledger
          </Link>
          <Link
            href="/admin/qard-hasan/new"
            className="btn-primary text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            New Qard Hasan
          </Link>
        </div>
      </div>

      {/* Error Alert with Retry button */}
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 p-4 text-xs sm:text-sm text-rose-800 dark:text-rose-300">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchLoans()}
            className="btn-secondary !py-1 !px-3 text-xs flex items-center gap-1.5 shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by loan #, beneficiary name, or phone..."
            className="input-field pl-9 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Accounting Group Filter */}
          <div className="w-44">
            <CustomSelect
              value={selectedGroup}
              onChange={(val) => {
                setSelectedGroup(String(val));
                setPage(1);
              }}
              options={[
                { value: "", label: "All Groups" },
                ...groups.map((g) => ({
                  value: String(g.id),
                  label: g.name,
                })),
              ]}
              searchable={true}
            />
          </div>

          {/* Beneficiary Filter */}
          <div className="w-44">
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
                  sublabel: b.beneficiary_number || b.code,
                })),
              ]}
              searchable={true}
            />
          </div>

          {/* Status Filter */}
          <div className="w-36">
            <CustomSelect
              value={selectedStatus}
              onChange={(val) => {
                setSelectedStatus(String(val));
                setPage(1);
              }}
              options={[
                { value: "", label: "All Statuses" },
                { value: "ACTIVE", label: "ACTIVE" },
                { value: "COMPLETED", label: "COMPLETED" },
                { value: "DEFAULTED", label: "DEFAULTED" },
              ]}
              searchable={false}
            />
          </div>
        </div>
      </div>

      {/* Loans Table */}
      <div className="table-container">
        <table className="table-custom">
          <thead>
            <tr>
              <th>Loan Reference</th>
              <th>Beneficiary</th>
              <th>Funding Sources</th>
              <th className="text-right">Principal</th>
              <th className="text-right">Monthly Rate</th>
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
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                    <span className="text-xs text-slate-500">Loading Qard Hasan...</span>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={9} className="text-center py-12">
                  <div className="flex flex-col items-center justify-center gap-2 text-rose-600 dark:text-rose-400">
                    <AlertCircle className="h-6 w-6" />
                    <p className="text-xs font-semibold">Unable to load Qard Hasan data. Please try again.</p>
                    <button
                      onClick={() => fetchLoans()}
                      className="btn-secondary !py-1 !px-3 text-xs mt-1 inline-flex items-center gap-1.5"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Retry
                    </button>
                  </div>
                </td>
              </tr>
            ) : loans.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-slate-400 dark:text-slate-500">
                  No Qard Hasan records found.
                </td>
              </tr>
            ) : (
              loans.map((l) => {
                const faCount = l.funding_allocations?.length || 0;
                return (
                  <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Loan Number */}
                    <td className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                      <Link
                        href={`/admin/qard-hasan/${l.id}`}
                        className="text-emerald-700 dark:text-emerald-400 hover:underline"
                      >
                        {l.qard_number}
                      </Link>
                    </td>

                    {/* Beneficiary */}
                    <td>
                      <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                        {l.beneficiary?.name || "Unknown"}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-400">
                        {l.beneficiary?.phone || "No phone"} • {l.beneficiary?.beneficiary_number || ""}
                      </div>
                    </td>

                    {/* Funding Sources */}
                    <td>
                      {faCount > 1 ? (
                        <div className="flex flex-wrap gap-1">
                          {l.funding_allocations.map((fa: any) => (
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
                      ) : l.funding_allocations && l.funding_allocations.length === 1 ? (
                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                          <FolderTree className="h-3 w-3 text-emerald-600" />
                          {l.funding_allocations[0].group?.name || l.group?.name || "Group"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                          <FolderTree className="h-3 w-3 text-emerald-600" />
                          {l.group?.name || "Group"}
                        </span>
                      )}
                    </td>

                    {/* Principal Amount */}
                    <td className="text-right font-bold text-xs text-slate-900 dark:text-slate-100 font-mono">
                      {formatCurrency(l.principal_amount)}
                    </td>

                    {/* Monthly Rate */}
                    <td className="text-right text-xs text-slate-600 dark:text-slate-400 font-mono">
                      {formatCurrency(l.monthly_repayment_amount)}/mo
                    </td>

                    {/* Total Repaid */}
                    <td className="text-right font-semibold text-xs text-emerald-700 dark:text-emerald-400 font-mono">
                      {formatCurrency(l.total_repaid)}
                    </td>

                    {/* Outstanding */}
                    <td className="text-right font-bold text-xs text-blue-700 dark:text-blue-400 font-mono">
                      {formatCurrency(l.outstanding_amount)}
                    </td>

                    {/* Status */}
                    <td>
                      <StatusBadge status={l.status} />
                    </td>

                    {/* Actions */}
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/qard-hasan/${l.id}`}
                          className="btn-secondary !py-1 !px-2 text-xs"
                          title="View Details"
                        >
                          Details
                        </Link>
                        {l.status === "ACTIVE" ? (
                          <Link
                            href={`/admin/qard-hasan/${l.id}/repay`}
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
