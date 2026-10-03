"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import {
  Tag,
  Plus,
  Search,
  Edit,
  Power,
  Receipt,
  BarChart3,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FolderTree
} from "lucide-react";

interface Category {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  total_expenses: number;
  total_amount: string | number;
  created_at: string;
  updated_at: string;
}

export default function ManageExpenseCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get("/expense-categories");
      setCategories(data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load expense categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleToggleStatus = async (cat: Category) => {
    setTogglingId(cat.id);
    try {
      const updatedStatus = !cat.is_active;
      await api.put(`/expense-categories/${cat.id}`, {
        is_active: updatedStatus,
      });
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, is_active: updatedStatus } : c))
      );
      setSuccessMsg(
        `Category "${cat.name}" has been ${updatedStatus ? "activated" : "deactivated"}.`
      );
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || "Failed to update category status");
    } finally {
      setTogglingId(null);
    }
  };

  const filteredCategories = categories.filter((c) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      (c.description && c.description.toLowerCase().includes(term))
    );
  });

  const totalAllExpenses = categories.reduce((sum, c) => sum + (c.total_expenses || 0), 0);
  const totalAllAmount = categories.reduce(
    (sum, c) => sum + parseFloat(String(c.total_amount || 0)),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-100 dark:border-rose-900">
              <Tag className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Manage Expense Categories
            </h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Define and classify expenditure purposes, operational heads, and charitable program types.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/admin/expenses/report"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <BarChart3 className="h-3.5 w-3.5 text-slate-500" />
            Expense Report
          </Link>
          <Link
            href="/admin/expenses"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Receipt className="h-3.5 w-3.5 text-slate-500" />
            Manage Expenses
          </Link>
          <Link
            href="/admin/expenses/categories/new"
            className="btn-primary inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Expense Category
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Categories</span>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            {categories.length}
          </p>
          <span className="text-[11px] text-slate-400">
            {categories.filter((c) => c.is_active).length} active, {categories.filter((c) => !c.is_active).length} inactive
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Recorded Expenses</span>
          <p className="mt-1 text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {totalAllExpenses}
          </p>
          <span className="text-[11px] text-slate-400">Across all categories</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Disbursed Volume</span>
          <p className="mt-1 text-2xl font-bold font-mono text-rose-700 dark:text-rose-400">
            {formatCurrency(totalAllAmount)}
          </p>
          <span className="text-[11px] text-slate-400">Cumulative expenditure</span>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs sm:text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300 animate-in fade-in duration-200">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Toolbar / Search */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search categories by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 text-xs"
          />
        </div>
      </div>

      {/* Categories Table */}
      <div className="table-container">
        <table className="table-custom">
          <thead>
            <tr>
              <th>CATEGORY</th>
              <th>STATUS</th>
              <th className="text-center">TOTAL EXPENSES</th>
              <th className="text-right">TOTAL AMOUNT</th>
              <th className="text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-foundation-700" />
                  <span className="mt-2 block text-xs text-slate-400">Loading expense categories...</span>
                </td>
              </tr>
            ) : filteredCategories.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-slate-400">
                  {search ? "No categories match your search." : "No expense categories registered yet."}
                </td>
              </tr>
            ) : (
              filteredCategories.map((cat) => (
                <tr key={cat.id}>
                  <td>
                    <div className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">
                      {cat.name}
                    </div>
                    {cat.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md truncate">
                        {cat.description}
                      </p>
                    )}
                  </td>
                  <td>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        cat.is_active
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                          : "bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                      }`}
                    >
                      {cat.is_active ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                  <td className="text-center font-mono font-semibold text-xs text-slate-700 dark:text-slate-300">
                    {cat.total_expenses || 0}
                  </td>
                  <td className="text-right font-mono font-bold text-xs text-rose-700 dark:text-rose-400">
                    {formatCurrency(cat.total_amount || 0)}
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/admin/expenses/categories/${cat.id}/edit`}
                        className="inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors"
                        title="Edit Category"
                      >
                        <Edit className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Edit</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleToggleStatus(cat)}
                        disabled={togglingId === cat.id}
                        className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                          cat.is_active
                            ? "bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 dark:text-amber-300"
                            : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-300"
                        }`}
                        title={cat.is_active ? "Deactivate Category" : "Activate Category"}
                      >
                        {togglingId === cat.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Power className="h-3.5 w-3.5" />
                        )}
                        <span>{cat.is_active ? "Deactivate" : "Activate"}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
