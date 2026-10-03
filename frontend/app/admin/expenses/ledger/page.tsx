"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Pagination } from "@/components/Pagination";
import { CustomSelect } from "@/components/ui/custom-select";
import {
  Receipt,
  Plus,
  Coins,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FolderTree,
  Tag,
  Search,
  Filter,
  FileSpreadsheet,
  ExternalLink,
  Building2,
  Calendar,
  CreditCard,
  User,
  ArrowRight
} from "lucide-react";

export default function ExpenseLedgerPage() {
  const [items, setItems] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    total_amount: "0.00",
    total_count: 0,
    top_category: null,
    top_category_amount: null,
    group_breakdown: {},
  });
  const [groups, setGroups] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // Filter state
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
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
        const [gRes, cRes] = await Promise.all([
          api.get("/groups"),
          api.get("/expense-categories"),
        ]);
        setGroups(gRes || []);
        setCategories(cRes || []);
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
      if (selectedCategory) params.append("category_id", selectedCategory);
      if (selectedMethod) params.append("payment_method", selectedMethod);
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);
      if (search.trim()) params.append("search", search.trim());

      const res = await api.get(`/expenses/ledger?${params.toString()}`);
      setItems(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.total_pages || 1);
      if (res.summary) setSummary(res.summary);
    } catch (err: any) {
      setError(err.message || "Failed to load expense ledger.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [page, pageSize, selectedGroup, selectedCategory, selectedMethod, startDate, endDate]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchLedger();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-100 dark:border-rose-900">
              <Receipt className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Expense Ledger
            </h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Authoritative double-entry accounting records for all operational and foundation disbursements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/expenses"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Manage Expenses
          </Link>
          <Link
            href="/admin/expenses/new"
            className="btn-primary inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Expense
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Disbursements</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
              <Coins className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {formatCurrency(summary.total_amount)}
          </div>
          <span className="text-[11px] text-slate-400">Total verified debits</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Expense Count</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {summary.total_count}
          </div>
          <span className="text-[11px] text-slate-400">Disbursement records</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Top Category</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <Tag className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-base font-bold text-slate-900 dark:text-white truncate" title={summary.top_category || "None"}>
            {summary.top_category || "N/A"}
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {summary.top_category_amount ? formatCurrency(summary.top_category_amount) : "৳0.00"}
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Funding Groups</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
              <FolderTree className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {Object.keys(summary.group_breakdown || {}).length}
          </div>
          <span className="text-[11px] text-slate-400">Accounting groups debited</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search voucher, description, payee, ref..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9 text-xs"
            />
          </div>

          {/* Group Filter */}
          <div>
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
              searchPlaceholder="Search groups..."
            />
          </div>

          {/* Category Filter */}
          <div>
            <CustomSelect
              value={selectedCategory}
              onChange={(val) => {
                setSelectedCategory(String(val));
                setPage(1);
              }}
              options={[
                { value: "", label: "All Categories" },
                ...categories.map((c) => ({
                  value: String(c.id),
                  label: c.name,
                })),
              ]}
              searchable={true}
              searchPlaceholder="Search categories..."
            />
          </div>

          {/* Method Filter */}
          <div>
            <CustomSelect
              value={selectedMethod}
              onChange={(val) => {
                setSelectedMethod(String(val));
                setPage(1);
              }}
              options={[
                { value: "", label: "All Methods" },
                { value: "CASH", label: "CASH" },
                { value: "BANK_TRANSFER", label: "BANK TRANSFER" },
                { value: "BKASH", label: "BKASH" },
                { value: "NAGAD", label: "NAGAD" },
                { value: "ROCKET", label: "ROCKET" },
                { value: "CHEQUE", label: "CHEQUE" },
              ]}
              searchable={false}
            />
          </div>

          {/* Clear Filters Button */}
          <div>
            <button
              type="button"
              onClick={() => {
                setSelectedGroup("");
                setSelectedCategory("");
                setSelectedMethod("");
                setStartDate("");
                setEndDate("");
                setSearch("");
                setPage(1);
              }}
              className="w-full btn-secondary text-xs py-2 flex items-center justify-center gap-1"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Date Range Sub-row */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-slate-500 font-medium flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" /> Date Range:
          </span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="input-field py-1 text-xs"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="input-field py-1 text-xs"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Ledger Table */}
      <div className="table-container">
        <table className="table-custom">
          <thead>
            <tr>
              <th>Date</th>
              <th>Voucher / ID</th>
              <th>Category</th>
              <th>Description</th>
              <th>Source Group</th>
              <th className="text-right">Amount (৳)</th>
              <th>Method</th>
              <th>Payee</th>
              <th>Reference</th>
              <th className="text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-foundation-700" />
                  <span className="mt-2 block text-xs text-slate-400">Loading ledger records...</span>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-12 text-slate-400">
                  No expense records match the specified filters.
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <tr key={row.id}>
                  <td className="text-xs font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {formatDate(row.expense_date)}
                  </td>
                  <td className="font-mono text-xs font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                    <Link
                      href={`/admin/expenses/${row.id}`}
                      className="text-foundation-700 dark:text-foundation-400 hover:underline"
                    >
                      {row.expense_number}
                    </Link>
                  </td>
                  <td>
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                      {row.category_name}
                    </span>
                  </td>
                  <td className="text-xs text-slate-700 dark:text-slate-300 max-w-xs truncate" title={row.description}>
                    {row.description}
                  </td>
                  <td>
                    <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      <FolderTree className="h-3 w-3 text-foundation-600" />
                      {row.group_name}
                    </span>
                  </td>
                  <td className="text-right font-mono font-bold text-xs text-rose-600 dark:text-rose-400 whitespace-nowrap">
                    -{formatCurrency(row.amount)}
                  </td>
                  <td className="font-mono text-xs text-slate-500 whitespace-nowrap">
                    {row.payment_method}
                  </td>
                  <td className="text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {row.payee || "-"}
                  </td>
                  <td className="text-xs font-mono text-slate-500 max-w-[120px] truncate" title={row.reference || ""}>
                    {row.reference || "-"}
                  </td>
                  <td className="text-center whitespace-nowrap">
                    <Link
                      href={`/admin/expenses/${row.id}`}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-foundation-700 hover:bg-foundation-50 dark:text-foundation-400 dark:hover:bg-slate-800"
                    >
                      Details <ArrowRight className="h-3 w-3" />
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
