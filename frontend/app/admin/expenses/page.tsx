"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Pagination } from "@/components/Pagination";
import { CustomSelect } from "@/components/ui/custom-select";
import { Modal } from "@/components/Modal";
import {
  Receipt,
  Plus,
  Tag,
  BarChart3,
  AlertCircle,
  Loader2,
  Search,
  FolderTree,
  Eye,
  RotateCcw,
  Calendar,
  CheckCircle2,
  Filter
} from "lucide-react";

export default function ManageExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Reversal Modal State
  const [reversingExpense, setReversingExpense] = useState<any | null>(null);
  const [reversalReason, setReversalReason] = useState("");
  const [reversing, setReversing] = useState(false);

  const fetchDropdowns = async () => {
    try {
      const [g, c] = await Promise.all([
        api.get("/groups"),
        api.get("/expense-categories"),
      ]);
      setGroups(g || []);
      setCategories(c || []);
    } catch {}
  };

  const fetchExpenses = async () => {
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

      const res = await api.get(`/expenses?${params.toString()}`);
      setExpenses(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.total_pages || 1);
    } catch (err: any) {
      setError(err.message || "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [page, pageSize, selectedGroup, selectedCategory, selectedMethod, startDate, endDate]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchExpenses();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleConfirmReversal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reversingExpense) return;
    setReversing(true);
    try {
      await api.post(`/expenses/${reversingExpense.id}/reverse`, {
        reason: reversalReason.trim() || "Administrative correction",
      });
      setSuccessMsg(
        `Expense ${reversingExpense.expense_number} was reversed successfully. The funds have been returned to ${reversingExpense.group?.name}.`
      );
      setReversingExpense(null);
      setReversalReason("");
      fetchExpenses();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      alert(err.message || "Failed to reverse expense transaction");
    } finally {
      setReversing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-100 dark:border-rose-900">
              <Receipt className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Manage Expenses
            </h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Track, audit, and disburse operational expenditures with double-entry accounting integrity.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/admin/expenses/categories"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Tag className="h-3.5 w-3.5 text-slate-500" />
            Expense Categories
          </Link>
          <Link
            href="/admin/expenses/report"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <BarChart3 className="h-3.5 w-3.5 text-slate-500" />
            Expense Report
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

      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs sm:text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300 animate-in fade-in duration-200">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search voucher #, description, payee, ref..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9 text-xs"
            />
          </div>

          {/* Source Group Filter */}
          <div>
            <CustomSelect
              value={selectedGroup}
              onChange={(val) => {
                setSelectedGroup(String(val));
                setPage(1);
              }}
              options={[
                { value: "", label: "All Source Groups" },
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

          {/* Payment Method Filter */}
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

          {/* Reset Filters */}
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

      {/* Table - Columns strictly matching user requirements */}
      <div className="table-container">
        <table className="table-custom">
          <thead>
            <tr>
              <th>EXPENSE ID</th>
              <th>DATE</th>
              <th>CATEGORY</th>
              <th>DESCRIPTION</th>
              <th>SOURCE GROUP</th>
              <th>PAYEE</th>
              <th>PAYMENT METHOD</th>
              <th className="text-right">AMOUNT</th>
              <th className="text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-foundation-700" />
                  <span className="mt-2 block text-xs text-slate-400">Loading expense records...</span>
                </td>
              </tr>
            ) : expenses.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-slate-400">
                  No expenses recorded matching the selected criteria.
                </td>
              </tr>
            ) : (
              expenses.map((exp) => {
                const isReversed = Boolean(exp.transaction?.is_reversed);
                return (
                  <tr key={exp.id} className={isReversed ? "opacity-60 bg-slate-50/50 dark:bg-slate-900/30" : ""}>
                    <td className="font-mono text-xs font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      <Link
                        href={`/admin/expenses/${exp.id}`}
                        className="text-foundation-700 dark:text-foundation-400 hover:underline"
                      >
                        {exp.expense_number}
                      </Link>
                      {isReversed && (
                        <span className="ml-1.5 inline-flex items-center rounded bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.2 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                          REVERSED
                        </span>
                      )}
                    </td>
                    <td className="text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(exp.expense_date)}
                    </td>
                    <td>
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                        {exp.category?.name || "Uncategorized"}
                      </span>
                    </td>
                    <td className="text-xs text-slate-700 dark:text-slate-300 max-w-xs truncate" title={exp.description}>
                      {exp.description || "-"}
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <FolderTree className="h-3 w-3 text-foundation-700" />
                        {exp.group?.name || "-"}
                      </span>
                    </td>
                    <td className="text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {exp.payee || "-"}
                    </td>
                    <td className="font-mono text-xs text-slate-500 whitespace-nowrap">
                      {exp.payment_method}
                    </td>
                    <td className="text-right font-mono font-bold text-xs whitespace-nowrap">
                      <span className={isReversed ? "line-through text-slate-400" : "text-rose-700 dark:text-rose-400"}>
                        -{formatCurrency(exp.amount)}
                      </span>
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/expenses/${exp.id}`}
                          className="inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors"
                          title="View Voucher Details"
                        >
                          <Eye className="h-3.5 w-3.5 text-foundation-700 dark:text-foundation-400" />
                          <span>Details</span>
                        </Link>

                        {!isReversed && (
                          <button
                            type="button"
                            onClick={() => {
                              setReversingExpense(exp);
                              setReversalReason("");
                            }}
                            className="inline-flex items-center gap-1 rounded bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 px-2 py-1 text-xs font-medium text-rose-600 dark:text-rose-400 transition-colors"
                            title="Reverse Expense Transaction"
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span className="hidden sm:inline">Reverse</span>
                          </button>
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

      {/* Safe Reversal Confirmation Modal */}
      <Modal
        isOpen={Boolean(reversingExpense)}
        onClose={() => setReversingExpense(null)}
        title="Reverse Expense Transaction"
      >
        {reversingExpense && (
          <form onSubmit={handleConfirmReversal} className="space-y-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200 space-y-1">
              <p className="font-bold">Accounting Contra-Entry Reversal</p>
              <p>
                Reversing this expense will create an offsetting financial inflow transaction of{" "}
                <strong>{formatCurrency(reversingExpense.amount)}</strong>, restoring the balance of{" "}
                <strong>{reversingExpense.group?.name}</strong>.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Voucher / Expense ID
              </label>
              <input
                disabled
                type="text"
                value={reversingExpense.expense_number}
                className="input-field text-xs bg-slate-100 dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reversal Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                placeholder="Reason for reversing this expense (e.g. Cancelled payment, duplicate entry, incorrect amount)..."
                className="input-field text-xs resize-y"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setReversingExpense(null)}
                className="btn-secondary text-xs px-3.5 py-1.5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={reversing || !reversalReason.trim()}
                className="btn-danger text-xs px-4 py-1.5 font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {reversing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirm Reversal
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
