"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { CustomSelect } from "@/components/ui/custom-select";
import {
  BarChart3,
  Calendar,
  Filter,
  Receipt,
  Tag,
  Plus,
  Loader2,
  AlertCircle,
  FolderTree,
  Printer,
  TrendingDown
} from "lucide-react";

interface CategoryReportItem {
  category_id: number;
  category_name: string;
  total_count: number;
  total_amount: string | number;
  percentage: number;
}

interface GroupReportItem {
  group_id: number;
  group_name: string;
  total_count: number;
  total_amount: string | number;
  percentage: number;
}

interface ReportData {
  total_amount: string | number;
  total_count: number;
  categories: CategoryReportItem[];
  groups: GroupReportItem[];
  start_date: string | null;
  end_date: string | null;
}

export default function ExpenseReportPage() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedGroup) params.append("group_id", selectedGroup);
      if (selectedCategory) params.append("category_id", selectedCategory);
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);

      const res = await api.get(`/expenses/report?${params.toString()}`);
      setReport(res);
    } catch (err: any) {
      setError(err.message || "Failed to load expense report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [selectedGroup, selectedCategory, startDate, endDate]);

  const handlePrint = () => {
    window.print();
  };

  const totalAmountNum = report ? parseFloat(String(report.total_amount || 0)) : 0;

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-100 dark:border-rose-900">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Expense Report & Breakdown
            </h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time categorization analysis, disbursement totals, and accounting group allocations.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap print:hidden">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Printer className="h-3.5 w-3.5 text-slate-500" />
            Print Report
          </button>
          <Link
            href="/admin/expenses/categories"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Tag className="h-3.5 w-3.5 text-slate-500" />
            Categories
          </Link>
          <Link
            href="/admin/expenses"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Receipt className="h-3.5 w-3.5 text-slate-500" />
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

      {/* Filter Toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3 print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Source Group Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
              Source Group
            </label>
            <CustomSelect
              value={selectedGroup}
              onChange={(val) => setSelectedGroup(String(val))}
              options={[
                { value: "", label: "All Accounting Groups" },
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
            <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
              Expense Category
            </label>
            <CustomSelect
              value={selectedCategory}
              onChange={(val) => setSelectedCategory(String(val))}
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

          {/* Start Date */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-field text-xs"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-field text-xs"
            />
          </div>

          {/* Reset Filters */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setSelectedGroup("");
                setSelectedCategory("");
                setStartDate("");
                setEndDate("");
              }}
              className="w-full btn-secondary text-xs py-2 flex items-center justify-center gap-1 font-medium"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-foundation-700" />
          <p className="mt-3 text-xs text-slate-400">Computing real-time category summaries...</p>
        </div>
      ) : report ? (
        <div className="space-y-6">
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Expenses Disbursed
              </span>
              <p className="mt-2 text-3xl font-extrabold font-mono text-rose-700 dark:text-rose-400">
                {formatCurrency(totalAmountNum)}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                Excludes reversed and cancelled entries
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Expense Transaction Count
              </span>
              <p className="mt-2 text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
                {report.total_count}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                Individual disbursement vouchers
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Average Per Expense
              </span>
              <p className="mt-2 text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
                {report.total_count > 0
                  ? formatCurrency(totalAmountNum / report.total_count)
                  : "৳0.00"}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                Across {report.categories.length} category heads
              </p>
            </div>
          </div>

          {/* Category-Wise Expense Summary Table (Primary Requirement) */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <div className="border-b border-slate-200 dark:border-slate-800 p-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Tag className="h-5 w-5 text-foundation-700" />
                  Category-Wise Expense Summary
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Summarizes expenses by category calculated directly from actual transaction records.
                </p>
              </div>
            </div>

            <div className="table-container border-0 rounded-none">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>CATEGORY</th>
                    <th className="text-center">TRANSACTIONS</th>
                    <th className="w-1/3">SHARE OF TOTAL</th>
                    <th className="text-right">TOTAL AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {report.categories.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-slate-400">
                        No expense records found for the selected filter period.
                      </td>
                    </tr>
                  ) : (
                    report.categories.map((cat) => (
                      <tr key={cat.category_id}>
                        <td className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">
                          {cat.category_name}
                        </td>
                        <td className="text-center font-mono font-semibold text-xs text-slate-700 dark:text-slate-300">
                          {cat.total_count}
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div
                                className="h-full bg-rose-500 rounded-full"
                                style={{ width: `${Math.min(100, Math.max(0, cat.percentage))}%` }}
                              />
                            </div>
                            <span className="font-mono text-xs font-semibold text-slate-500 min-w-10 text-right">
                              {cat.percentage}%
                            </span>
                          </div>
                        </td>
                        <td className="text-right font-mono font-bold text-xs sm:text-sm text-rose-700 dark:text-rose-400">
                          {formatCurrency(cat.total_amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-300 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-950 font-bold">
                    <td className="text-slate-900 dark:text-white uppercase text-xs sm:text-sm">
                      TOTAL EXPENSE
                    </td>
                    <td className="text-center font-mono text-xs sm:text-sm text-slate-900 dark:text-white">
                      {report.total_count}
                    </td>
                    <td className="text-xs text-slate-500">100.0% of expenditure</td>
                    <td className="text-right font-mono text-base font-extrabold text-rose-700 dark:text-rose-400">
                      {formatCurrency(totalAmountNum)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Group-Wise Breakdown Table */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <div className="border-b border-slate-200 dark:border-slate-800 p-5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FolderTree className="h-5 w-5 text-foundation-700" />
                Source Accounting Group Allocations
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Breakdown of funds debited across accounting groups.
              </p>
            </div>

            <div className="table-container border-0 rounded-none">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>ACCOUNTING GROUP</th>
                    <th className="text-center">TRANSACTIONS</th>
                    <th className="w-1/3">SHARE OF TOTAL</th>
                    <th className="text-right">TOTAL DISBURSED</th>
                  </tr>
                </thead>
                <tbody>
                  {report.groups.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-slate-400">
                        No groups recorded for the selected filter period.
                      </td>
                    </tr>
                  ) : (
                    report.groups.map((grp) => (
                      <tr key={grp.group_id}>
                        <td className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">
                          {grp.group_name}
                        </td>
                        <td className="text-center font-mono font-semibold text-xs text-slate-700 dark:text-slate-300">
                          {grp.total_count}
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div
                                className="h-full bg-foundation-600 rounded-full"
                                style={{ width: `${Math.min(100, Math.max(0, grp.percentage))}%` }}
                              />
                            </div>
                            <span className="font-mono text-xs font-semibold text-slate-500 min-w-10 text-right">
                              {grp.percentage}%
                            </span>
                          </div>
                        </td>
                        <td className="text-right font-mono font-bold text-xs sm:text-sm text-rose-700 dark:text-rose-400">
                          {formatCurrency(grp.total_amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-300 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-950 font-bold">
                    <td className="text-slate-900 dark:text-white uppercase text-xs sm:text-sm">
                      TOTAL ALL GROUPS
                    </td>
                    <td className="text-center font-mono text-xs sm:text-sm text-slate-900 dark:text-white">
                      {report.total_count}
                    </td>
                    <td className="text-xs text-slate-500">100.0% of expenditure</td>
                    <td className="text-right font-mono text-base font-extrabold text-rose-700 dark:text-rose-400">
                      {formatCurrency(totalAmountNum)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
