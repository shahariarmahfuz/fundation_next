"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import {
  Tag,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  List,
  Receipt
} from "lucide-react";

export default function EditExpenseCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [stats, setStats] = useState({ total_expenses: 0, total_amount: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategory = async () => {
      setLoading(true);
      setError(null);
      try {
        const cat = await api.get(`/expense-categories/${id}`);
        setName(cat.name || "");
        setDescription(cat.description || "");
        setIsActive(cat.is_active ?? true);
        setStats({
          total_expenses: cat.total_expenses || 0,
          total_amount: parseFloat(String(cat.total_amount || 0)),
        });
      } catch (err: any) {
        setError(err.message || "Failed to load category details");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCategory();
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await api.put(`/expense-categories/${id}`, {
        name: name.trim(),
        description: description.trim() || undefined,
        is_active: isActive,
      });
      router.push("/admin/expenses/categories");
    } catch (err: any) {
      setError(err.message || "Failed to update expense category.");
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/admin/expenses/categories"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Categories
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 shadow-sm border border-rose-100 dark:border-rose-900">
              <Tag className="h-5 w-5" />
            </div>
            Edit Expense Category
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Modify category classification name, active status, or usage description.
          </p>
        </div>

        <Link
          href="/admin/expenses/categories"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <List className="h-3.5 w-3.5 text-slate-500" />
          View Categories
        </Link>
      </div>

      {/* Usage Stats Card */}
      {!loading && (
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs text-slate-500 dark:text-slate-400">Associated Expenses</span>
            <p className="mt-1 text-xl font-bold font-mono text-slate-900 dark:text-white">
              {stats.total_expenses}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs text-slate-500 dark:text-slate-400">Total Amount Disbursed</span>
            <p className="mt-1 text-xl font-bold font-mono text-rose-700 dark:text-rose-400">
              {formatCurrency(stats.total_amount)}
            </p>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-foundation-600" />
          <p className="mt-3 text-xs text-slate-500">Loading category information...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
          {/* Category Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Category Name <span className="text-rose-500">*</span>
            </label>
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Guest / Hospitality, Shop Expenses, Food"
              className="input-field text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Description / Usage Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain what kind of expenses should be recorded under this category..."
              className="input-field text-xs resize-y"
            />
          </div>

          {/* Active Toggle */}
          <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-foundation-700 focus:ring-foundation-700 dark:border-slate-700 dark:bg-slate-800"
            />
            <label htmlFor="isActive" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              Active Category (available for selection when recording new expenses)
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <Link
              href="/admin/expenses/categories"
              className="btn-secondary text-xs px-4 py-2 font-medium"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="btn-primary text-xs px-5 py-2 font-semibold inline-flex items-center gap-2 disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
