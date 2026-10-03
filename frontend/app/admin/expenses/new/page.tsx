"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { getFoundationTodayDate } from "@/lib/timezone";
import {
  Receipt,
  Plus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  FolderTree,
  Calendar,
  Wallet,
  Tag,
  User,
  ExternalLink,
  X,
  List
} from "lucide-react";

export default function NewExpensePage() {
  // Reference data
  const [groups, setGroups] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);

  // Form State
  const [groupId, setGroupId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(
    getFoundationTodayDate()
  );
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [payee, setPayee] = useState("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    expenseNumber: string;
    expenseId: number;
    amount: number;
    categoryName: string;
    groupName: string;
  } | null>(null);

  const loadData = async () => {
    try {
      const [gRes, cRes] = await Promise.all([
        api.get("/groups"),
        api.get("/expense-categories"),
      ]);
      const activeGroups = (gRes || []).filter((g: any) => g.status !== "INACTIVE");
      const activeCats = (cRes || []).filter((c: any) => c.is_active);

      setGroups(activeGroups);
      setCategories(activeCats);

      if (activeGroups.length > 0 && !groupId) {
        setGroupId(String(activeGroups[0].id));
      }
      if (activeCats.length > 0 && !categoryId) {
        setCategoryId(String(activeCats[0].id));
      }
    } catch (err: any) {
      setError(err.message || "Failed to load accounting groups or expense categories.");
    } finally {
      setLoadingRefs(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedGroup = groups.find((g) => String(g.id) === String(groupId));
  const selectedCategory = categories.find((c) => String(c.id) === String(categoryId));
  const groupAvailableBalance = selectedGroup ? parseFloat(selectedGroup.current_balance || "0") : 0;
  const numAmount = parseFloat(amount) || 0;
  const isInsufficient = numAmount > groupAvailableBalance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!groupId) {
      setError("Please select a Source Accounting Group.");
      return;
    }
    if (!categoryId) {
      setError("Please select an Expense Category.");
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Expense amount must be strictly greater than 0 BDT.");
      return;
    }
    if (numAmount > groupAvailableBalance) {
      setError(
        `Insufficient group balance. ${selectedGroup?.name || "Selected group"} has only ৳${groupAvailableBalance.toLocaleString(
          undefined,
          { minimumFractionDigits: 2 }
        )} available, but ৳${numAmount.toLocaleString(undefined, {
          minimumFractionDigits: 2,
        })} was requested. Expenses cannot result in a negative balance.`
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/expenses", {
        group_id: parseInt(groupId),
        category_id: parseInt(categoryId),
        amount: numAmount,
        expense_date: expenseDate,
        payment_method: paymentMethod,
        payee: payee.trim() || undefined,
        description: note.trim() || undefined,
        notes: note.trim() || undefined,
        reference: reference.trim() || undefined,
      });

      // Show modern animated success banner on page (NO redirect)
      setSuccessInfo({
        expenseNumber: res.expense_number,
        expenseId: res.id,
        amount: numAmount,
        categoryName: selectedCategory?.name || "Expense",
        groupName: selectedGroup?.name || "Accounting Group",
      });

      // Reset form fields
      setAmount("");
      setPayee("");
      setReference("");
      setNote("");

      // Refresh groups list to reflect newly updated balance
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to record expense.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAnother = () => {
    setSuccessInfo(null);
    setAmount("");
    setNote("");
    setPayee("");
    setReference("");
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/admin/expenses"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Expenses
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 shadow-sm border border-rose-100 dark:border-rose-900">
              <Receipt className="h-5 w-5" />
            </div>
            Add Expense
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Post an expenditure transaction against an accounting group with double-entry ledger allocation.
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
            href="/admin/expenses"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <List className="h-3.5 w-3.5 text-slate-500" />
            Manage Expenses
          </Link>
        </div>
      </div>

      {/* Modern Animated Success Banner (Stays on Add Expense Page) */}
      {successInfo && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/95 p-5 shadow-lg backdrop-blur dark:bg-emerald-950/50 dark:border-emerald-600/40 transition-all animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-emerald-950 dark:text-emerald-100 flex items-center gap-2">
                    ✓ Expense recorded successfully
                  </h3>
                  <span className="font-mono text-xs text-emerald-800 dark:text-emerald-300">
                    Voucher ID: {successInfo.expenseNumber}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSuccessInfo(null)}
                  className="rounded-lg p-1 text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
                  title="Dismiss notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Required Details: Category, Amount, Source Group */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="rounded-xl bg-emerald-100/70 p-3 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800">
                  <span className="block text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">
                    Expense Category
                  </span>
                  <span className="text-sm font-bold text-emerald-950 dark:text-emerald-100">
                    {successInfo.categoryName}
                  </span>
                </div>

                <div className="rounded-xl bg-emerald-100/70 p-3 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800">
                  <span className="block text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">
                    Expense Amount
                  </span>
                  <span className="text-sm font-bold font-mono text-rose-700 dark:text-rose-400">
                    {formatCurrency(successInfo.amount)}
                  </span>
                </div>

                <div className="rounded-xl bg-emerald-100/70 p-3 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800">
                  <span className="block text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">
                    Source Group
                  </span>
                  <span className="text-sm font-bold text-emerald-950 dark:text-emerald-100">
                    {successInfo.groupName}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Add Another Expense & Manage Expenses */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleAddAnother}
                  className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Another Expense
                </button>

                <Link
                  href="/admin/expenses"
                  className="btn-secondary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200"
                >
                  <List className="h-3.5 w-3.5" />
                  Manage Expenses
                </Link>

                <Link
                  href={`/admin/expenses/${successInfo.expenseId}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:underline ml-auto"
                >
                  View Expense Details <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Insufficient Balance Warning Banner */}
      {isInsufficient && numAmount > 0 && selectedGroup && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs sm:text-sm text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <p className="font-bold text-amber-950 dark:text-amber-100">
                Insufficient group balance
              </p>
              <p className="mt-0.5 text-xs">
                <strong>{selectedGroup.name}</strong> currently has only{" "}
                <strong>৳{groupAvailableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong> available,
                but you are attempting to spend{" "}
                <strong>৳{numAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>.
                Expenses cannot make the group balance negative.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form */}
      {loadingRefs ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-foundation-600" />
          <p className="mt-3 text-xs text-slate-500">Loading accounting groups and expense categories...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left 2 Cols: Form Inputs */}
            <div className="md:col-span-2 space-y-6">
              {/* Allocation & Category Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <FolderTree className="h-4 w-4 text-foundation-600" />
                  Expense Details
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Source Accounting Group * */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Source Accounting Group <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={groupId}
                      onChange={(e) => setGroupId(e.target.value)}
                      className="input-field text-xs font-medium"
                    >
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name} (৳{parseFloat(g.current_balance || "0").toLocaleString(undefined, { minimumFractionDigits: 2 })})
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      The expense will be debited from this group&apos;s available funds.
                    </p>
                  </div>

                  {/* Expense Category * */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Expense Category <span className="text-rose-500">*</span>
                      </label>
                      <Link
                        href="/admin/expenses/categories/new"
                        className="text-[11px] font-semibold text-foundation-700 hover:text-foundation-900 dark:text-foundation-400 flex items-center gap-0.5"
                      >
                        <Plus className="h-3 w-3" /> New Category
                      </Link>
                    </div>

                    <select
                      required
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="input-field text-xs font-medium"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      Identifies the purpose or classification of the expenditure.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Expense Amount * */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Expense Amount (৳ BDT) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">৳</span>
                      <input
                        required
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className={`input-field pl-8 font-mono text-sm font-bold ${
                          isInsufficient ? "border-amber-400 focus:border-amber-500" : ""
                        }`}
                      />
                    </div>
                  </div>

                  {/* Expense Date * */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Expense Date <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        required
                        type="date"
                        value={expenseDate}
                        onChange={(e) => setExpenseDate(e.target.value)}
                        className="input-field pl-9 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Payment Method * */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Payment Method <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="input-field text-xs font-medium"
                    >
                      <option value="CASH">CASH</option>
                      <option value="BANK_TRANSFER">BANK TRANSFER</option>
                      <option value="BKASH">BKASH</option>
                      <option value="NAGAD">NAGAD</option>
                      <option value="ROCKET">ROCKET</option>
                      <option value="CHEQUE">CHEQUE</option>
                    </select>
                  </div>

                  {/* Payee / Recipient (Optional) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Payee / Recipient (Optional)
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={payee}
                        onChange={(e) => setPayee(e.target.value)}
                        placeholder="Vendor, contractor, landlord, or hospital name"
                        className="input-field pl-9 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Reference / Voucher No (Optional) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Receipt / Reference No. (Optional)
                  </label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="e.g. Memo #204, Trx ID, or Invoice #"
                    className="input-field text-xs"
                  />
                </div>

                {/* Note / Description (Optional) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Note / Description (Optional)
                  </label>
                  <textarea
                    rows={4}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Specific details of this transaction (e.g. Guests from the local committee visited today. ৳1,500 was spent on food and ৳1,000 on refreshments)..."
                    className="input-field text-xs resize-y"
                  />
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    Category identifies where the expense occurred. The note explains specific transaction details.
                  </p>
                </div>
              </div>
            </div>

            {/* Right 1 Col: Summary & Liquidity Overview */}
            <div className="space-y-6">
              {/* Selected Group Liquidity Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center justify-between">
                  <span>Group Liquidity Check</span>
                  <Wallet className="h-4 w-4 text-foundation-600" />
                </h3>

                {selectedGroup ? (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-950">
                      <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {selectedGroup.name}
                      </span>
                      <div className="mt-1 flex items-baseline justify-between">
                        <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                          ৳{groupAvailableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] font-semibold uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                          Available
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs pt-1">
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Disbursement:</span>
                        <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                          -৳{numAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2 font-semibold">
                        <span className="text-slate-700 dark:text-slate-300">Remaining Balance:</span>
                        <span
                          className={`font-mono font-bold ${
                            isInsufficient
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-emerald-700 dark:text-emerald-400"
                          }`}
                        >
                          ৳{(groupAvailableBalance - numAmount).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>

                    {isInsufficient && (
                      <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800">
                        Disbursement exceeds available group funds. Negative balances are prevented.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Select an accounting group to view liquidity.</p>
                )}
              </div>

              {/* Form Action Buttons */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
                <button
                  type="submit"
                  disabled={submitting || isInsufficient || numAmount <= 0}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-3 text-sm font-bold shadow-md shadow-foundation-700/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Recording Expense...
                    </>
                  ) : (
                    <>
                      <Receipt className="h-4 w-4" />
                      Record Expense
                    </>
                  )}
                </button>

                <Link
                  href="/admin/expenses"
                  className="w-full btn-secondary flex items-center justify-center py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </Link>

                <p className="text-[11px] text-center text-slate-400 dark:text-slate-500">
                  Strict double-entry accounting: writes immutable financial transaction and debits group balance.
                </p>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
