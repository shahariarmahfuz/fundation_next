"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Pagination } from "@/components/Pagination";
import { CustomSelect } from "@/components/ui/custom-select";
import {
  HandHeart,
  Search,
  Filter,
  RotateCcw,
  Loader2,
  Calendar,
  Building,
  User,
  ArrowUpRight,
  ArrowDownLeft,
  Scale,
  HeartHandshake,
  CreditCard,
  Plus,
  UserPlus,
  Users
} from "lucide-react";

interface LedgerItem {
  id: number;
  transaction_number: string;
  transaction_date: string;
  transaction_type: string;
  flow_type: string;
  amount: string | number;
  balance_after: string | number;
  description: string;
  payment_method: string;
  reference?: string | null;
  beneficiary_id: number;
  beneficiary_name: string;
  beneficiary_number: string;
  group_id: number;
  group_name: string;
  group_code?: string | null;
  created_by_name?: string | null;
  is_reversed: boolean;
}

interface LedgerSummary {
  total_aid_disbursed: string | number;
  total_sadakah: string | number;
  total_qard_disbursed: string | number;
  total_qard_repaid: string | number;
  net_qard_outstanding: string | number;
}

export default function BeneficiaryLedgerPage() {
  const [items, setItems] = useState<LedgerItem[]>([]);
  const [summary, setSummary] = useState<LedgerSummary | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter options
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);

  // Filter States
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState("");
  const [selectedAidType, setSelectedAidType] = useState("ALL");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");

  // Load filter options (beneficiaries & groups)
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [bRes, gRes] = await Promise.all([
          api.get("/beneficiaries?page=1&page_size=200").catch(() => ({ items: [] })),
          api.get("/groups").catch(() => []),
        ]);
        setBeneficiaries(bRes.items || []);
        setGroups(gRes || []);
      } catch (err) {
        console.error("Failed to load filter options", err);
      }
    };
    loadFilters();
  }, []);

  // Fetch Ledger records
  const fetchLedger = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });

      if (selectedBeneficiaryId) params.append("beneficiary_id", selectedBeneficiaryId);
      if (selectedAidType && selectedAidType !== "ALL") params.append("aid_type", selectedAidType);
      if (selectedGroupId) params.append("group_id", selectedGroupId);
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);
      if (search.trim()) params.append("search", search.trim());

      const res = await api.get(`/beneficiaries/ledger?${params.toString()}`);
      setItems(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.total_pages || 1);
      setSummary(res.summary || null);
    } catch (err: any) {
      console.error("Failed to fetch beneficiary ledger", err);
      setError(err.message || "Failed to load ledger records");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, selectedBeneficiaryId, selectedAidType, selectedGroupId, dateFrom, dateTo, search]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  const handleResetFilters = () => {
    setSelectedBeneficiaryId("");
    setSelectedAidType("ALL");
    setSelectedGroupId("");
    setDateFrom("");
    setDateTo("");
    setSearch("");
    setPage(1);
  };

  const getAidTypeBadge = (txnType: string) => {
    if (txnType === "SADAKAH") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
          <HeartHandshake className="w-3 h-3" />
          Sadakah Grant
        </span>
      );
    }
    if (txnType === "QARD_HASAN_DISBURSEMENT" || txnType === "QARD_DISBURSEMENT") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
          <Scale className="w-3 h-3" />
          Qard Hasan Loan
        </span>
      );
    }
    if (txnType === "QARD_HASAN_REPAYMENT" || txnType === "QARD_REPAYMENT") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
          <ArrowDownLeft className="w-3 h-3" />
          Qard Repayment
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
        {txnType}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2.5">
            <HandHeart className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Beneficiary Financial Assistance Ledger</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Complete central double-entry audit ledger for all welfare assistance, Sadakah grants, and interest-free Qard Hasan disbursements &amp; repayments.
          </p>
        </div>

        {/* Action Buttons: Responsive, Clear Hierarchy, Mobile-First */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto shrink-0">
          <Link
            href="/admin/beneficiaries/new"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-xl shadow-sm transition-all whitespace-nowrap min-h-[44px]"
          >
            <UserPlus className="w-4 h-4 shrink-0" />
            <span>Add Beneficiary</span>
          </Link>

          <Link
            href="/admin/beneficiaries"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 active:bg-slate-100 rounded-xl shadow-xs transition-all whitespace-nowrap min-h-[44px]"
          >
            <Users className="w-4 h-4 shrink-0 text-slate-400 dark:text-slate-500" />
            <span>Manage Beneficiaries</span>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Total Aid Disbursed
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-white mt-1">
              {formatCurrency(parseFloat(String(summary.total_aid_disbursed)))}
            </div>
            <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
              Sadakah + Qard Disbursed
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <HeartHandshake className="w-3.5 h-3.5" />
              Sadakah Grants
            </div>
            <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
              {formatCurrency(parseFloat(String(summary.total_sadakah)))}
            </div>
            <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
              Non-repayable grants
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
              <Scale className="w-3.5 h-3.5" />
              Qard Disbursed
            </div>
            <div className="text-xl font-bold text-blue-700 dark:text-blue-300 mt-1">
              {formatCurrency(parseFloat(String(summary.total_qard_disbursed)))}
            </div>
            <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
              Total principal disbursed
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
            <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
              <ArrowDownLeft className="w-3.5 h-3.5" />
              Qard Repaid
            </div>
            <div className="text-xl font-bold text-indigo-700 dark:text-indigo-300 mt-1">
              {formatCurrency(parseFloat(String(summary.total_qard_repaid)))}
            </div>
            <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
              Recovered back to groups
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
            <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Net Outstanding Qard
            </div>
            <div className="text-xl font-bold text-amber-700 dark:text-amber-300 mt-1">
              {formatCurrency(parseFloat(String(summary.net_qard_outstanding)))}
            </div>
            <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
              Active loan balance
            </div>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search voucher, name, code, note..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs sm:text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all placeholder:text-gray-400"
            />
          </div>

          {/* Beneficiary Filter */}
          <div>
            <CustomSelect
              value={selectedBeneficiaryId}
              onChange={(val) => {
                setSelectedBeneficiaryId(String(val));
                setPage(1);
              }}
              options={[
                { value: "", label: "All Beneficiaries" },
                ...beneficiaries.map((b) => ({
                  value: String(b.id),
                  label: b.name,
                  sublabel: `(${b.code || b.beneficiary_number})`,
                })),
              ]}
              searchable={true}
              searchPlaceholder="Search beneficiaries..."
              triggerClassName="py-2 text-xs sm:text-sm h-10"
            />
          </div>

          {/* Aid Type Filter */}
          <div>
            <CustomSelect
              value={selectedAidType}
              onChange={(val) => {
                setSelectedAidType(String(val));
                setPage(1);
              }}
              options={[
                { value: "ALL", label: "All Aid Types" },
                { value: "SADAKAH", label: "Sadakah Grants" },
                { value: "QARD_HASAN", label: "All Qard Hasan" },
                { value: "QARD_DISBURSEMENT", label: "Qard Disbursements" },
                { value: "QARD_REPAYMENT", label: "Qard Repayments" },
              ]}
              searchable={false}
              triggerClassName="py-2 text-xs sm:text-sm h-10"
            />
          </div>

          {/* Group Filter */}
          <div>
            <CustomSelect
              value={selectedGroupId}
              onChange={(val) => {
                setSelectedGroupId(String(val));
                setPage(1);
              }}
              options={[
                { value: "", label: "All Groups" },
                ...groups.map((g) => ({
                  value: String(g.id),
                  label: g.name,
                  sublabel: `(${g.code})`,
                })),
              ]}
              searchable={true}
              searchPlaceholder="Search groups..."
              triggerClassName="py-2 text-xs sm:text-sm h-10"
            />
          </div>

          {/* Reset button */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={handleResetFilters}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          </div>
        </div>

        {/* Date Filters Row */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 dark:text-gray-400 font-medium">Date Range:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs text-gray-900 dark:text-white"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500 mb-2" />
            <span>Loading beneficiary ledger records...</span>
          </div>
        ) : error ? (
          <div className="py-16 text-center text-red-500">{error}</div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center text-gray-500 dark:text-gray-400">
            <HandHeart className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-base font-medium">No ledger records match the selected criteria.</p>
            <p className="text-xs text-gray-400 mt-1">Try resetting filters to view all assistance entries.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 uppercase text-[11px] font-semibold border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Voucher #</th>
                  <th className="px-4 py-3">Beneficiary</th>
                  <th className="px-4 py-3">Aid Type</th>
                  <th className="px-4 py-3">Group</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Method &amp; Ref</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-right">Balance After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {items.map((row) => {
                  const isOutflow = row.flow_type === "OUTFLOW";
                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      {/* Date */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-gray-600 dark:text-gray-300 text-xs">
                        {formatDateTime(row.transaction_date)}
                      </td>

                      {/* Voucher Number */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-mono text-xs font-semibold text-gray-900 dark:text-white">
                          {row.transaction_number}
                        </span>
                      </td>

                      {/* Beneficiary */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <Link
                          href={`/admin/beneficiaries/${row.beneficiary_id}`}
                          className="font-medium text-primary-600 dark:text-primary-400 hover:underline"
                        >
                          {row.beneficiary_name}
                        </Link>
                        <div className="text-[11px] font-mono text-gray-400">
                          {row.beneficiary_number}
                        </div>
                      </td>

                      {/* Aid Type */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {getAidTypeBadge(row.transaction_type)}
                      </td>

                      {/* Group */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-gray-900 dark:text-gray-100 font-medium">
                          {row.group_name}
                        </span>
                        {row.group_code && (
                          <span className="ml-1 text-[11px] font-mono text-gray-400">
                            ({row.group_code})
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-right">
                        <span
                          className={`font-mono font-bold text-sm ${
                            isOutflow
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {isOutflow ? "- " : "+ "}
                          {formatCurrency(parseFloat(String(row.amount)))}
                        </span>
                      </td>

                      {/* Payment Method & Reference */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-600 dark:text-gray-300">
                        <div className="font-medium">{row.payment_method}</div>
                        {row.reference && (
                          <div className="text-[11px] text-gray-400 font-mono">
                            Ref: {row.reference}
                          </div>
                        )}
                      </td>

                      {/* Description */}
                      <td className="px-4 py-3.5 max-w-xs truncate text-xs text-gray-600 dark:text-gray-300">
                        <span title={row.description}>{row.description}</span>
                      </td>

                      {/* Balance After */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-right font-mono text-xs text-gray-500 dark:text-gray-400">
                        {formatCurrency(parseFloat(String(row.balance_after)))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            total={total}
            pageSize={pageSize}
          />
        </div>
      </div>
    </div>
  );
}
