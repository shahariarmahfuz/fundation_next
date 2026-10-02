"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FolderTree,
  ArrowLeft,
  Loader2,
  Plus,
  Coins,
  FileText,
  Sparkles,
  RotateCcw
} from "lucide-react";
import { api } from "@/lib/api";
import { useFlash, getUserFriendlyErrorMessage } from "@/lib/flash";
import { formatCurrency } from "@/lib/utils";

export default function CreateNewGroupPage() {
  const { flash } = useFlash();

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    opening_balance: "0.00",
    description: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Frontend validation: Group Name is required
    const cleanName = formData.name.trim();
    if (!cleanName) {
      flash.warning("Group Name required", "Please enter a name for the new accounting group.");
      return;
    }

    // 2. Validate opening balance if provided
    const parsedBalance = parseFloat(formData.opening_balance);
    if (isNaN(parsedBalance) || parsedBalance < 0) {
      flash.warning("Invalid opening balance", "Opening balance must be a non-negative amount (0 or greater).");
      return;
    }

    setSubmitting(true);

    try {
      const payload: any = {
        name: cleanName,
        status: "ACTIVE",
        opening_balance: parsedBalance,
      };

      if (formData.code.trim()) {
        payload.code = formData.code.trim().toUpperCase();
      }

      if (formData.description.trim()) {
        payload.description = formData.description.trim();
      }

      const res = await api.post("/groups", payload);

      // Trigger premium SaaS Flash notification
      flash.success("Group created successfully", `${res.name} has been created successfully.`, {
        details: [
          { label: "Group Code", value: res.code },
          { label: "Opening Balance", value: formatCurrency(res.opening_balance || 0) },
        ],
      });

      // Reset form so the user can immediately create another Group
      setFormData({
        code: "",
        name: "",
        opening_balance: "0.00",
        description: "",
      });

      // Focus the name field for convenient rapid data entry
      const nameInput = document.getElementById("group-name-input");
      nameInput?.focus();
    } catch (err: any) {
      // Do NOT clear form on error — preserve user's entered data
      flash.error("Unable to create group", getUserFriendlyErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      code: "",
      name: "",
      opening_balance: "0.00",
      description: "",
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      {/* Top Header & Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/groups"
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          title="Return to Manage Groups"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Create New Group
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Create a new financial accounting group and define its opening balance and purpose.
          </p>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FolderTree className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Group Information
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Enter the required group identification and optional opening ledger parameters.
            </p>
          </div>

          <div className="space-y-5">
            {/* Group Code (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Group Code <span className="text-slate-400 font-normal">(Optional)</span></span>
                <span className="text-[10px] text-slate-400 font-mono">Format: G-XXXX</span>
              </label>
              <input
                type="text"
                placeholder="Leave blank to automatically generate the next serial (e.g. G-0001)"
                className="input-field uppercase font-mono"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Leave blank to automatically generate the next serial (e.g. G-0001, G-0002).
              </p>
            </div>

            {/* Group Name (Required) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Group Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="group-name-input"
                required
                type="text"
                placeholder="e.g. General Group, Education Support Fund, Emergency Relief"
                className="input-field"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Unique identifier for the group in ledgers, reports, and member assignments.
              </p>
            </div>

            {/* Opening Balance (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Opening Balance (BDT ৳)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">৳</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="input-field pl-8 font-mono"
                  value={formData.opening_balance}
                  onChange={(e) => setFormData({ ...formData, opening_balance: e.target.value })}
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Initial financial ledger balance credited to this group upon establishment. Defaults to ৳0.00.
              </p>
            </div>

            {/* Description (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Description <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="Purpose and fund allocation rules for this group..."
                className="input-field"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Summary of the group's objectives, funding policies, and intended beneficiaries.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Link
              href="/admin/groups"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Group...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create Group
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
