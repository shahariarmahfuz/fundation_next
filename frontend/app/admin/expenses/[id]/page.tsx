"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Receipt,
  ArrowLeft,
  Coins,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FolderTree,
  Tag,
  Calendar,
  Wallet,
  Building2,
  FileText,
  User,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  Hash,
  Clock
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ExpenseDetailPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const expenseId = resolvedParams.id;

  const [expense, setExpense] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpense = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get(`/expenses/${expenseId}`);
      setExpense(data);
    } catch (err: any) {
      setError(err.message || "Failed to load expense details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpense();
  }, [expenseId]);

  if (loading) {
    return (
      <div className="flex h-72 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-foundation-600" />
      </div>
    );
  }

  if (error || !expense) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto py-12">
        <div className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 p-5 text-sm text-rose-800 dark:text-rose-300 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <span>{error || "Expense voucher not found."}</span>
        </div>
        <Link href="/admin/expenses" className="btn-secondary text-xs inline-flex items-center gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Manage Expenses
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin/expenses"
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Manage Expenses
            </Link>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              <Receipt className="h-6 w-6 text-rose-600 dark:text-rose-400" />
              Voucher: {expense.expense_number}
            </h1>
            <span className="inline-flex items-center rounded-full bg-rose-50 dark:bg-rose-950/50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
              DISBURSED
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Recorded on {formatDate(expense.expense_date)} &bull; Source Group: {expense.group?.name}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/admin/expenses/ledger"
            className="btn-secondary text-xs inline-flex items-center gap-1.5"
          >
            <FolderTree className="h-3.5 w-3.5 text-slate-500" />
            View in Ledger
          </Link>
          <Link
            href="/admin/expenses/new"
            className="btn-primary text-xs inline-flex items-center gap-1.5"
          >
            <Receipt className="h-3.5 w-3.5" />
            New Expense
          </Link>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Voucher Breakdown */}
        <div className="md:col-span-2 space-y-6">
          {/* Core Info */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <FileText className="h-4 w-4 text-foundation-600" />
              Voucher Overview
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                <span className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400 block mb-1">
                  Disbursed Amount
                </span>
                <span className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
                  {formatCurrency(expense.amount)}
                </span>
                <span className="block text-[11px] text-slate-400 mt-1">Non-repayable operational disbursement</span>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                <span className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400 block mb-1">
                  Expense Category
                </span>
                <span className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Tag className="h-4 w-4 text-foundation-600" />
                  {expense.category?.name || "Uncategorized"}
                </span>
                {expense.category?.description && (
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {expense.category.description}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Description</span>
                <p className="mt-0.5 text-sm font-medium text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  {expense.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-semibold text-slate-500 dark:text-slate-400">Payee / Recipient:</span>
                  <p className="mt-0.5 font-medium text-slate-800 dark:text-slate-200">
                    {expense.payee || "Not specified"}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 dark:text-slate-400">Payment Method:</span>
                  <p className="mt-0.5 font-mono font-medium text-slate-800 dark:text-slate-200">
                    {expense.payment_method}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 dark:text-slate-400">Expense Date:</span>
                  <p className="mt-0.5 font-medium text-slate-800 dark:text-slate-200">
                    {formatDate(expense.expense_date)}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 dark:text-slate-400">Reference / Receipt #:</span>
                  <p className="mt-0.5 font-mono text-slate-800 dark:text-slate-200">
                    {expense.reference || "None"}
                  </p>
                </div>
              </div>

              {expense.notes && (
                <div className="pt-2">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Internal Notes:</span>
                  <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300 italic bg-amber-50/50 dark:bg-amber-950/20 p-2.5 rounded-lg border border-amber-100 dark:border-amber-900/40">
                    {expense.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Double-Entry Accounting Journal Section */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Double-Entry Accounting Journal
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                TXN ID: {expense.transaction_id}
              </span>
            </h2>

            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/60 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Transaction Number:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {expense.transaction?.transaction_number || `TXN-${expense.transaction_id}`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Flow Type:</span>
                <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-0.5 font-mono text-[11px] font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-400">
                  OUTFLOW (DEBIT EXPENSE / CREDIT GROUP)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Debited Accounting Group:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {expense.group?.name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Amount Reduced:</span>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                  -{formatCurrency(expense.amount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Metadata & Source Group Card */}
        <div className="space-y-6">
          {/* Source Group Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center justify-between">
              <span>Source Group</span>
              <FolderTree className="h-4 w-4 text-foundation-600" />
            </h3>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950 space-y-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white block">
                {expense.group?.name}
              </span>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-800">
                <span className="text-slate-500">Group ID:</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{expense.group_id}</span>
              </div>
              {expense.group?.current_balance !== undefined && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Current Balance:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    ৳{parseFloat(expense.group.current_balance || "0").toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Metadata Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3 text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-foundation-600" />
              Audit & Record Meta
            </h3>

            <div className="space-y-2 text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Created At:</span>
                <span className="font-mono">{formatDate(expense.created_at)}</span>
              </div>
              {expense.created_by && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Created By:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {expense.created_by.full_name || expense.created_by.username}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Last Updated:</span>
                <span className="font-mono">{formatDate(expense.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
