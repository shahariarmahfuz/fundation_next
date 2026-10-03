"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { getFoundationTodayDate } from "@/lib/timezone";
import { CustomSelect } from "@/components/ui/custom-select";
import {
  Heart,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Building2,
  FolderTree,
  Calendar,
  Wallet,
  FileText,
  UserCheck,
  Check,
  Sparkles,
  ExternalLink
} from "lucide-react";

interface AllocationRow {
  group_id: string;
  amount: string;
}

export default function NewSadaqahPage() {
  const router = useRouter();

  // Reference data with decoupled loading & error states
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [loadingBeneficiaries, setLoadingBeneficiaries] = useState(true);
  const [beneficiariesError, setBeneficiariesError] = useState<string | null>(null);

  const [groups, setGroups] = useState<any[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [groupsError, setGroupsError] = useState<string | null>(null);

  // Form State
  const [beneficiaryId, setBeneficiaryId] = useState("");
  const [beneficiarySearch, setBeneficiarySearch] = useState("");
  const [amount, setAmount] = useState("2000.00");
  const [description, setDescription] = useState("Emergency medical assistance");
  const [disbursementDate, setDisbursementDate] = useState(
    getFoundationTodayDate()
  );
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  // Multi-Group Allocations
  const [allocations, setAllocations] = useState<AllocationRow[]>([
    { group_id: "", amount: "2000.00" }
  ]);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdGrant, setCreatedGrant] = useState<any | null>(null);

  const loadBeneficiaries = async () => {
    setLoadingBeneficiaries(true);
    setBeneficiariesError(null);
    try {
      const bRes = await api.get("/beneficiaries?page=1&page_size=200");
      const bList = bRes.items || [];
      setBeneficiaries(bList);
      if (bList.length > 0 && !beneficiaryId) {
        setBeneficiaryId(String(bList[0].id));
      }
    } catch (err: any) {
      setBeneficiariesError(err.message || "Unable to load beneficiaries.");
    } finally {
      setLoadingBeneficiaries(false);
    }
  };

  const loadGroups = async () => {
    setLoadingGroups(true);
    setGroupsError(null);
    try {
      const gRes = await api.get("/groups");
      const gList = Array.isArray(gRes) ? gRes : [];
      setGroups(gList);
      if (gList.length > 0 && (!allocations[0] || !allocations[0].group_id)) {
        setAllocations([{ group_id: String(gList[0].id), amount: amount }]);
      }
    } catch (err: any) {
      setGroupsError(err.message || "Unable to load accounting groups.");
    } finally {
      setLoadingGroups(false);
    }
  };

  useEffect(() => {
    loadBeneficiaries();
    loadGroups();
  }, []);

  // Update allocation amount when total amount changes (if only 1 row)
  const handleAmountChange = (val: string) => {
    setAmount(val);
    if (allocations.length === 1) {
      setAllocations([{ ...allocations[0], amount: val }]);
    }
  };

  // Add allocation row
  const addAllocationRow = () => {
    const usedGroupIds = new Set(allocations.map((a) => a.group_id));
    const availableGroup = groups.find((g) => !usedGroupIds.has(String(g.id))) || groups[0];
    const currentTotal = allocations.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0);
    const parsedAmount = parseFloat(amount) || 0;
    const remaining = Math.max(0, parsedAmount - currentTotal);

    setAllocations([
      ...allocations,
      {
        group_id: availableGroup ? String(availableGroup.id) : "",
        amount: remaining > 0 ? remaining.toFixed(2) : "0.00",
      },
    ]);
  };

  // Remove allocation row
  const removeAllocationRow = (index: number) => {
    if (allocations.length <= 1) return;
    const newRows = [...allocations];
    newRows.splice(index, 1);
    setAllocations(newRows);
  };

  // Update allocation row
  const updateAllocationRow = (index: number, field: keyof AllocationRow, val: string) => {
    const newRows = [...allocations];
    newRows[index] = { ...newRows[index], [field]: val };
    setAllocations(newRows);
  };

  // Max available helper
  const handleMaxAvailable = (index: number) => {
    const row = allocations[index];
    const group = groups.find((g) => String(g.id) === row.group_id);
    if (!group) return;

    const groupBalance = parseFloat(group.current_balance) || 0;
    const currentOtherTotal = allocations.reduce((sum, a, i) => {
      if (i === index) return sum;
      return sum + (parseFloat(a.amount) || 0);
    }, 0);
    const remainingNeeded = Math.max(0, (parseFloat(amount) || 0) - currentOtherTotal);
    const fillAmount = Math.min(groupBalance, remainingNeeded);

    updateAllocationRow(index, "amount", fillAmount.toFixed(2));
  };

  // Calculations & Validations
  const parsedAmount = parseFloat(amount) || 0;
  const totalAllocated = allocations.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0);
  const diff = Number((totalAllocated - parsedAmount).toFixed(2));
  const isBalanced = Math.abs(diff) < 0.005 && parsedAmount > 0;

  // Check group balance overdrafts
  const overdraftWarnings: string[] = [];
  const groupUsageMap: Record<string, number> = {};
  allocations.forEach((a) => {
    if (a.group_id) {
      const amt = parseFloat(a.amount) || 0;
      groupUsageMap[a.group_id] = (groupUsageMap[a.group_id] || 0) + amt;
    }
  });

  Object.entries(groupUsageMap).forEach(([gid, usedAmt]) => {
    const grp = groups.find((g) => String(g.id) === gid);
    if (grp) {
      const bal = parseFloat(grp.current_balance) || 0;
      if (usedAmt > bal) {
        overdraftWarnings.push(
          `Group "${grp.name}" allocation (৳${usedAmt.toLocaleString("en-BD", { minimumFractionDigits: 2 })}) exceeds available balance (৳${bal.toLocaleString("en-BD", { minimumFractionDigits: 2 })}) by ৳${(usedAmt - bal).toLocaleString("en-BD", { minimumFractionDigits: 2 })}`
        );
      }
    }
  });

  // Duplicate group check
  const duplicateGroupIds = allocations
    .map((a) => a.group_id)
    .filter((gid, i, arr) => gid && arr.indexOf(gid) !== i);

  const canSubmit =
    !submitting &&
    !loadingBeneficiaries &&
    !loadingGroups &&
    !beneficiariesError &&
    !groupsError &&
    beneficiaryId &&
    parsedAmount > 0 &&
    description.trim().length > 0 &&
    isBalanced &&
    overdraftWarnings.length === 0 &&
    duplicateGroupIds.length === 0 &&
    allocations.every((a) => a.group_id && (parseFloat(a.amount) || 0) > 0);

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        beneficiary_id: parseInt(beneficiaryId),
        amount: parsedAmount,
        description: description.trim(),
        disbursement_date: disbursementDate,
        payment_method: paymentMethod,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
        funding_allocations: allocations.map((a) => ({
          group_id: parseInt(a.group_id),
          amount: parseFloat(a.amount),
        })),
      };

      const result = await api.post("/sadaqah", payload);
      setCreatedGrant(result);

      // Reset form fields
      setAmount("2000.00");
      setDescription("Emergency medical assistance");
      setReference("");
      setNotes("");
      if (groups.length > 0) {
        setAllocations([{ group_id: String(groups[0].id), amount: "2000.00" }]);
      }

      // Refresh groups list to reflect deducted balances
      const gRes = await api.get("/groups");
      setGroups(Array.isArray(gRes) ? gRes : []);

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setError(
        err.message ||
          "Unable to disburse Sadaqah. No accounting changes were made. Please review the selected Groups and available balances."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBeneficiaries = beneficiaries.filter((b) => {
    if (!beneficiarySearch.trim()) return true;
    const term = beneficiarySearch.toLowerCase().trim();
    return (
      b.name?.toLowerCase().includes(term) ||
      b.phone?.includes(term) ||
      b.beneficiary_number?.toLowerCase().includes(term) ||
      b.nid?.toLowerCase().includes(term)
    );
  });

  const selectedBeneficiaryObj = beneficiaries.find((b) => String(b.id) === beneficiaryId);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin/sadaqah"
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Manage Sadaqah
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Heart className="h-6 w-6 text-rose-600 dark:text-rose-400 fill-rose-100 dark:fill-rose-950/40" />
            New Sadaqah (Non-Repayable Aid)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Disburse non-repayable humanitarian aid funded by one or multiple groups with exact accounting isolation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/sadaqah/ledger" className="btn-secondary text-xs">
            <FolderTree className="h-3.5 w-3.5" />
            Sadaqah Ledger
          </Link>
          <Link href="/admin/sadaqah" className="btn-secondary text-xs">
            Manage Sadaqah
          </Link>
        </div>
      </div>

      {/* Success Flash Toast / Receipt Card */}
      {createdGrant && (
        <div className="rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-5 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <Check className="h-5 w-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-950 dark:text-emerald-100 flex items-center gap-2">
                  ✓ Sadaqah Disbursed Successfully!
                  <span className="text-[10px] font-mono uppercase bg-emerald-200 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-full font-bold">
                    {createdGrant.sadakah_number}
                  </span>
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  <strong>{formatCurrency(createdGrant.amount)}</strong> has been provided to{" "}
                  <strong>{createdGrant.beneficiary?.name || "Beneficiary"}</strong>.
                  Contributing group ledger balance(s) have been permanently debited.
                </p>
              </div>
            </div>
            <button
              onClick={() => setCreatedGrant(null)}
              className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:underline"
            >
              Dismiss
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white/70 dark:bg-slate-900/70 p-3 rounded-lg border border-emerald-200 dark:border-emerald-850 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Beneficiary</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {createdGrant.beneficiary?.name} ({createdGrant.beneficiary?.beneficiary_number})
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Purpose / Relief</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {createdGrant.description}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Disbursement Date</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {createdGrant.disbursement_date}
              </span>
            </div>
          </div>

          {/* Multi-Group Funding breakdown */}
          {createdGrant.funding_allocations && createdGrant.funding_allocations.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Funded by {createdGrant.funding_allocations.length} Group(s):
              </span>
              <div className="flex flex-wrap gap-2">
                {createdGrant.funding_allocations.map((fa: any) => (
                  <div
                    key={fa.id}
                    className="inline-flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-700 px-2.5 py-1 rounded-md text-xs font-medium text-emerald-900 dark:text-emerald-100"
                  >
                    <FolderTree className="h-3 w-3 text-emerald-700 dark:text-emerald-400" />
                    <span>{fa.group?.name || `Group #${fa.group_id}`}:</span>
                    <strong className="font-bold">{formatCurrency(fa.allocated_amount)}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Link
              href={`/admin/sadaqah/${createdGrant.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 text-xs font-semibold shadow-xs transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View Grant Details & Allocations
            </Link>
            <button
              onClick={() => setCreatedGrant(null)}
              className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              + Disburse Another Sadaqah
            </button>
          </div>
        </div>
      )}

      {/* General Error Banner */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 p-4 text-xs sm:text-sm text-rose-800 dark:text-rose-300">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Creation Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Beneficiary Selection */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 text-xs font-bold">
                1
              </span>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Select Beneficiary (Recipient) <span className="text-rose-500">*</span>
              </h2>
            </div>
            <Link
              href="/admin/beneficiaries/new"
              target="_blank"
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />
              New Beneficiary
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Beneficiary <span className="text-rose-500">*</span>
              </label>
              <CustomSelect
                required
                value={beneficiaryId}
                onChange={(val) => setBeneficiaryId(String(val))}
                options={beneficiaries.map((b) => ({
                  value: String(b.id),
                  label: b.name,
                  sublabel: `[${b.beneficiary_number}] ${b.phone ? `— ${b.phone}` : ""}`,
                  badge: b.status,
                }))}
                placeholder="-- Select Beneficiary --"
                emptyMessage="No beneficiaries found"
                searchable={true}
                searchPlaceholder="Search by name, phone, code, or NID..."
              />
              <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                Total {beneficiaries.length} registered beneficiaries available
              </p>
            </div>

            {selectedBeneficiaryObj ? (
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4 space-y-2.5 text-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Beneficiary Profile
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  {selectedBeneficiaryObj.name}
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300 pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Phone</span>
                    <span>{selectedBeneficiaryObj.phone || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Beneficiary Code</span>
                    <span className="font-mono">{selectedBeneficiaryObj.beneficiary_number}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">NID / ID</span>
                    <span>{selectedBeneficiaryObj.nid || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Status</span>
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                      {selectedBeneficiaryObj.status}
                    </span>
                  </div>
                </div>
                {selectedBeneficiaryObj.address && (
                  <div className="pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <strong>Address:</strong> {selectedBeneficiaryObj.address}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center p-6 text-center text-xs text-slate-400">
                <UserCheck className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
                Select a beneficiary from the list to view profile details
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Sadaqah Details */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 text-xs font-bold">
              2
            </span>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Grant Details (100% Non-Repayable)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Sadaqah Amount (৳ BDT) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">৳</span>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="input-field pl-8 font-bold text-slate-900 dark:text-slate-100 text-sm"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Direct humanitarian grant (Non-repayable)
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Disbursement Date <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="date"
                className="input-field text-xs"
                value={disbursementDate}
                onChange={(e) => setDisbursementDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payment Method
              </label>
              <CustomSelect
                value={paymentMethod}
                onChange={(val) => setPaymentMethod(String(val))}
                options={[
                  { value: "CASH", label: "CASH" },
                  { value: "BANK_TRANSFER", label: "BANK TRANSFER" },
                  { value: "BKASH", label: "BKASH" },
                  { value: "NAGAD", label: "NAGAD" },
                ]}
                searchable={false}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Purpose / Description <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Emergency medical assistance, ration supply"
                className="input-field text-xs"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Voucher / Transaction Reference
              </label>
              <input
                type="text"
                placeholder="e.g. SDQ-REC-001 or bank receipt #"
                className="input-field text-xs"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Internal Notes / Assessment Remarks
            </label>
            <input
              type="text"
              placeholder="e.g. Approved by relief committee under humanitarian emergency program"
              className="input-field text-xs"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Step 3: Multi-Group Funding Allocation Builder */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 text-xs font-bold">
                3
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Funding Sources (Single or Multi-Group Capital)
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Select one or more accounting groups to fund this grant. Contributing group balances will be permanently reduced.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={addAllocationRow}
              className="btn-secondary !py-1 !px-2.5 text-xs flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Another Group
            </button>
          </div>

          {/* Allocation Rows */}
          <div className="space-y-3">
            {allocations.map((row, idx) => {
              const currentGroup = groups.find((g) => String(g.id) === row.group_id);
              const groupBalance = currentGroup ? parseFloat(currentGroup.current_balance) || 0 : 0;
              const rowAmount = parseFloat(row.amount) || 0;
              const isOverdraft = currentGroup && rowAmount > groupBalance;

              return (
                <div
                  key={idx}
                  className={`rounded-lg border p-3.5 transition-all ${
                    isOverdraft
                      ? "border-rose-300 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/20"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-3">
                    {/* Group Selector */}
                    <div className="flex-1">
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Source Group #{idx + 1} <span className="text-rose-500">*</span>
                      </label>
                      <CustomSelect
                        required
                        value={row.group_id}
                        onChange={(val) => updateAllocationRow(idx, "group_id", String(val))}
                        options={groups.map((g) => ({
                          value: String(g.id),
                          label: `${g.name} (${g.code})`,
                          sublabel: `Avail: ${formatCurrency(g.current_balance)}`,
                        }))}
                        placeholder="-- Select Accounting Group --"
                        searchable={true}
                        searchPlaceholder="Search groups..."
                      />
                    </div>

                    {/* Available Balance Chip */}
                    <div className="md:w-44">
                      <span className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Available Balance
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-bold font-mono ${
                            groupBalance > 0
                              ? "bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          }`}
                        >
                          <Wallet className="h-3 w-3" />
                          {currentGroup ? formatCurrency(groupBalance) : "—"}
                        </span>
                        {currentGroup && groupBalance > 0 && (
                          <button
                            type="button"
                            onClick={() => handleMaxAvailable(idx)}
                            className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline uppercase bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-1 rounded border border-emerald-200 dark:border-emerald-800"
                            title="Auto-fill up to available balance or remaining needed"
                          >
                            Max Avail
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Allocated Amount */}
                    <div className="md:w-48">
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Allocation (৳) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-bold">৳</span>
                        <input
                          required
                          type="number"
                          step="0.01"
                          min="0.01"
                          className={`input-field pl-7 text-xs font-bold ${
                            isOverdraft ? "border-rose-500 text-rose-600" : ""
                          }`}
                          value={row.amount}
                          onChange={(e) => updateAllocationRow(idx, "amount", e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Actions (Delete Row) */}
                    <div className="flex items-end justify-end md:self-center md:pt-4">
                      <button
                        type="button"
                        onClick={() => removeAllocationRow(idx)}
                        disabled={allocations.length <= 1}
                        className={`p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors ${
                          allocations.length <= 1 ? "opacity-30 cursor-not-allowed" : ""
                        }`}
                        title="Remove funding group row"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {isOverdraft && (
                    <div className="mt-2 text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      Group &quot;{currentGroup?.name}&quot; does not have sufficient available funds. Exceeds available balance by{" "}
                      {formatCurrency(rowAmount - groupBalance)}!
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Duplicate warning */}
          {duplicateGroupIds.length > 0 && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
              <span>
                The same group is selected multiple times. Please combine allocations into a single row per group.
              </span>
            </div>
          )}

          {/* Real-Time Balance & Discrepancy Verification Card */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
              <div className="flex items-center gap-4 flex-wrap">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Sadaqah Amount</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">
                    {formatCurrency(parsedAmount)}
                  </span>
                </div>
                <div className="text-slate-300 dark:text-slate-700 hidden sm:block font-bold">|</div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Allocated</span>
                  <span
                    className={`text-sm font-bold font-mono ${
                      isBalanced
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-rose-700 dark:text-rose-400"
                    }`}
                  >
                    {formatCurrency(totalAllocated)}
                  </span>
                </div>
                <div className="text-slate-300 dark:text-slate-700 hidden sm:block font-bold">|</div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Remaining / Diff</span>
                  <span
                    className={`text-sm font-bold font-mono ${
                      isBalanced
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-rose-700 dark:text-rose-400"
                    }`}
                  >
                    {formatCurrency(Math.abs(diff))} {diff > 0 ? "(Over)" : diff < 0 ? "(Under)" : "(Exact)"}
                  </span>
                </div>
              </div>

              {/* Status Indicator Badge */}
              <div>
                {isBalanced ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    Allocation Balanced (৳0.00 difference)
                  </span>
                ) : diff < 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 px-3 py-1 text-xs font-bold text-amber-800 dark:text-amber-300">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    Under-allocated by {formatCurrency(Math.abs(diff))}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 px-3 py-1 text-xs font-bold text-rose-800 dark:text-rose-300">
                    <AlertCircle className="h-4 w-4 text-rose-600" />
                    Over-allocated by {formatCurrency(diff)}
                  </span>
                )}
              </div>
            </div>

            {/* Overdraft warnings */}
            {overdraftWarnings.map((warn, i) => (
              <div key={i} className="text-xs text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                {warn}
              </div>
            ))}
          </div>
        </div>

        {/* Submit Bar */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Sadaqah is non-repayable. Contributing group balances will be permanently debited upon confirmation.
          </div>

          <div className="flex items-center gap-3">
            <Link href="/admin/sadaqah" className="btn-secondary text-xs">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={!canSubmit}
              className={`btn-primary text-xs !py-2.5 !px-5 flex items-center gap-2 ${
                !canSubmit ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Disbursing Sadaqah & Debiting Ledgers...
                </>
              ) : (
                <>
                  <Heart className="h-4 w-4 fill-current" />
                  Disburse Sadaqah ({formatCurrency(parsedAmount)})
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
