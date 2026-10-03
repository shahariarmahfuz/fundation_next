"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { getFoundationTodayDate } from "@/lib/timezone";
import {
  Scale,
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

export default function NewQardHasanPage() {
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
  const [principalAmount, setPrincipalAmount] = useState("10000.00");
  const [monthlyRepayment, setMonthlyRepayment] = useState("1000.00");
  const [disbursedDate, setDisbursedDate] = useState(getFoundationTodayDate());
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [reference, setReference] = useState("");
  const [scheduleNotes, setScheduleNotes] = useState("10 installments of ৳1,000");
  const [notes, setNotes] = useState("");

  // Multi-Group Allocations
  const [allocations, setAllocations] = useState<AllocationRow[]>([
    { group_id: "", amount: "10000.00" }
  ]);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdLoan, setCreatedLoan] = useState<any | null>(null);

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
        setAllocations([{ group_id: String(gList[0].id), amount: principalAmount }]);
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

  // Update monthly repayment placeholder when principal changes
  const handlePrincipalChange = (val: string) => {
    setPrincipalAmount(val);
    const p = parseFloat(val) || 0;
    if (p > 0) {
      const calcMonthly = Math.round(p / 10);
      setMonthlyRepayment(String(calcMonthly));
      setScheduleNotes(`10 installments of ৳${calcMonthly.toLocaleString("en-BD")}`);
      // If there's only 1 allocation row, auto-sync its amount
      if (allocations.length === 1) {
        setAllocations([{ ...allocations[0], amount: val }]);
      }
    }
  };

  // Add allocation row
  const addAllocationRow = () => {
    // Find first unused group
    const usedGroupIds = new Set(allocations.map((a) => a.group_id));
    const availableGroup = groups.find((g) => !usedGroupIds.has(String(g.id))) || groups[0];
    const currentTotal = allocations.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0);
    const remaining = Math.max(0, (parseFloat(principalAmount) || 0) - currentTotal);

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
    const remainingNeeded = Math.max(0, (parseFloat(principalAmount) || 0) - currentOtherTotal);
    const fillAmount = Math.min(groupBalance, remainingNeeded);

    updateAllocationRow(index, "amount", fillAmount.toFixed(2));
  };

  // Calculations & Validations
  const parsedPrincipal = parseFloat(principalAmount) || 0;
  const totalAllocated = allocations.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0);
  const diff = Number((totalAllocated - parsedPrincipal).toFixed(2));
  const isBalanced = Math.abs(diff) < 0.005 && parsedPrincipal > 0;

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
    parsedPrincipal > 0 &&
    parseFloat(monthlyRepayment) > 0 &&
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
        principal_amount: parsedPrincipal,
        monthly_repayment_amount: parseFloat(monthlyRepayment),
        disbursed_date: disbursedDate,
        payment_method: paymentMethod,
        reference: reference.trim() || undefined,
        repayment_schedule_notes: scheduleNotes.trim() || undefined,
        notes: notes.trim() || undefined,
        funding_allocations: allocations.map((a) => ({
          group_id: parseInt(a.group_id),
          amount: parseFloat(a.amount),
        })),
      };

      const result = await api.post("/qard-hasan", payload);
      setCreatedLoan(result);

      // Reset form fields
      setPrincipalAmount("10000.00");
      setMonthlyRepayment("1000.00");
      setScheduleNotes("10 installments of ৳1,000");
      setReference("");
      setNotes("");
      if (groups.length > 0) {
        setAllocations([{ group_id: String(groups[0].id), amount: "10000.00" }]);
      }

      // Refresh groups list to reflect deducted balances
      const gRes = await api.get("/groups");
      setGroups(Array.isArray(gRes) ? gRes : []);

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setError(err.message || "Failed to disburse Qard Hasan loan.");
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
              href="/admin/qard-hasan"
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Manage Qard Hasan
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Scale className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            New Qard Hasan (Interest-Free Loan)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Multi-group funding with exact balance tracking and 0.00 BDT mathematical integrity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/qard-hasan/ledger"
            className="btn-secondary text-xs"
          >
            <FolderTree className="h-3.5 w-3.5" />
            View Ledger
          </Link>
          <Link
            href="/admin/qard-hasan"
            className="btn-secondary text-xs"
          >
            All Loans
          </Link>
        </div>
      </div>

      {/* Success Flash Toast / Receipt Card */}
      {createdLoan && (
        <div className="rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-5 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <Check className="h-5 w-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-950 dark:text-emerald-100 flex items-center gap-2">
                  Qard Hasan Disbursed Successfully!
                  <span className="text-[10px] font-mono uppercase bg-emerald-200 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-full font-bold">
                    {createdLoan.qard_number}
                  </span>
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Principal of <strong>{formatCurrency(createdLoan.principal_amount)}</strong> has been disbursed to{" "}
                  <strong>{createdLoan.beneficiary?.name || "Beneficiary"}</strong>. Accounting ledgers have been debited accurately.
                </p>
              </div>
            </div>
            <button
              onClick={() => setCreatedLoan(null)}
              className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:underline"
            >
              Dismiss
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white/70 dark:bg-slate-900/70 p-3 rounded-lg border border-emerald-200 dark:border-emerald-850 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Beneficiary</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {createdLoan.beneficiary?.name} ({createdLoan.beneficiary?.beneficiary_number})
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Monthly Repayment</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {formatCurrency(createdLoan.monthly_repayment_amount)}/month
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Disbursement Date</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {createdLoan.disbursed_date}
              </span>
            </div>
          </div>

          {/* Multi-Group Funding breakdown pill */}
          {createdLoan.funding_allocations && createdLoan.funding_allocations.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Funding Allocations Debited:
              </span>
              <div className="flex flex-wrap gap-2">
                {createdLoan.funding_allocations.map((fa: any) => (
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
              href={`/admin/qard-hasan/${createdLoan.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 text-xs font-semibold shadow-xs transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View Loan Details & Allocations
            </Link>
            <button
              onClick={() => setCreatedLoan(null)}
              className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              + Disburse Another Loan
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
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                1
              </span>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Select Beneficiary (Recipient)
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
                Filter / Search Beneficiary
              </label>

              {loadingBeneficiaries ? (
                <div className="flex flex-col items-center justify-center p-8 border border-slate-200 dark:border-[#242424] rounded-xl bg-slate-50 dark:bg-[#0D0D0D]">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-500 mb-2" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">Loading beneficiaries from database...</span>
                </div>
              ) : beneficiariesError ? (
                <div className="p-4 border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 rounded-xl text-xs space-y-2">
                  <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-semibold">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>Unable to load beneficiaries.</span>
                  </div>
                  <p className="text-[11px] text-rose-700 dark:text-rose-400">{beneficiariesError}</p>
                  <button
                    type="button"
                    onClick={loadBeneficiaries}
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              ) : beneficiaries.length === 0 ? (
                <div className="p-6 border border-dashed border-slate-300 dark:border-[#242424] rounded-xl text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
                  <p className="font-semibold text-slate-700 dark:text-slate-300">No beneficiaries found in database.</p>
                  <Link
                    href="/admin/beneficiaries/new"
                    className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Register First Beneficiary
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Search by name, phone, code, or NID..."
                    className="input-field text-xs"
                    value={beneficiarySearch}
                    onChange={(e) => setBeneficiarySearch(e.target.value)}
                  />

                  {filteredBeneficiaries.length === 0 ? (
                    <div className="p-5 border border-dashed border-slate-300 dark:border-[#242424] rounded-xl text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
                      <p>
                        No beneficiaries found matching &ldquo;<span className="font-semibold text-slate-800 dark:text-slate-200">{beneficiarySearch}</span>&rdquo;
                      </p>
                      <button
                        type="button"
                        onClick={() => setBeneficiarySearch("")}
                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
                      >
                        Clear Search Filter ({beneficiaries.length} total available)
                      </button>
                    </div>
                  ) : (
                    <select
                      required
                      size={5}
                      className="input-field text-xs leading-normal font-medium h-36"
                      value={beneficiaryId}
                      onChange={(e) => setBeneficiaryId(e.target.value)}
                    >
                      {filteredBeneficiaries.map((b) => (
                        <option
                          key={b.id}
                          value={b.id}
                          className="p-1.5 hover:bg-emerald-50 dark:hover:bg-[#151515]"
                        >
                          [{b.beneficiary_number}] {b.name} — ({b.phone || "No phone"}) [{b.status}]
                        </option>
                      ))}
                    </select>
                  )}
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    Showing {filteredBeneficiaries.length} of {beneficiaries.length} beneficiaries
                  </p>
                </div>
              )}
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

        {/* Step 2: Loan Financial Terms */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
              2
            </span>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Loan Terms & Schedule (0% Interest Strictly)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Principal Amount (৳ BDT) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">৳</span>
                <input
                  required
                  type="number"
                  step="100"
                  min="100"
                  className="input-field pl-8 font-bold text-slate-900 dark:text-slate-100 text-sm"
                  value={principalAmount}
                  onChange={(e) => handlePrincipalChange(e.target.value)}
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Total interest-free capital disbursed
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Monthly Repayment Target (৳) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">৳</span>
                <input
                  required
                  type="number"
                  step="50"
                  min="50"
                  className="input-field pl-8 text-sm"
                  value={monthlyRepayment}
                  onChange={(e) => setMonthlyRepayment(e.target.value)}
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Expected tenure:{" "}
                <strong>
                  {parsedPrincipal > 0 && parseFloat(monthlyRepayment) > 0
                    ? `${Math.ceil(parsedPrincipal / parseFloat(monthlyRepayment))} months`
                    : "—"}
                </strong>
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
                value={disbursedDate}
                onChange={(e) => setDisbursedDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Disbursement Payment Method
              </label>
              <select
                className="input-field text-xs"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="CASH">CASH</option>
                <option value="BANK_TRANSFER">BANK TRANSFER</option>
                <option value="BKASH">BKASH</option>
                <option value="NAGAD">NAGAD</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Transaction Reference / Receipt #
              </label>
              <input
                type="text"
                placeholder="e.g. DISB-2026-001 or bank check #"
                className="input-field text-xs"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Repayment Schedule Notes
              </label>
              <input
                type="text"
                placeholder="e.g. 10 equal installments on the 5th of every month"
                className="input-field text-xs"
                value={scheduleNotes}
                onChange={(e) => setScheduleNotes(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Internal Purpose / Loan Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Small business micro-grant support for grocery store"
                className="input-field text-xs"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Step 3: Multi-Group Funding Allocation Builder */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                3
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Funding Sources (Single or Multi-Group Capital)
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Allocate capital from one or more accounting groups. Repayments will return to each group proportionally.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={addAllocationRow}
              className="btn-secondary !py-1 !px-2.5 text-xs flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Funding Group
            </button>
          </div>

          {/* Allocation Rows */}
          {loadingGroups ? (
            <div className="flex flex-col items-center justify-center p-8 border border-slate-200 dark:border-[#242424] rounded-xl bg-slate-50 dark:bg-[#0D0D0D]">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-500 mb-2" />
              <span className="text-xs text-slate-500 dark:text-slate-400">Loading accounting groups and balances...</span>
            </div>
          ) : groupsError ? (
            <div className="p-4 border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 rounded-xl text-xs space-y-2">
              <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-semibold">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>Unable to load accounting groups.</span>
              </div>
              <p className="text-[11px] text-rose-700 dark:text-rose-400">{groupsError}</p>
              <button
                type="button"
                onClick={loadGroups}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : groups.length === 0 ? (
            <div className="p-6 border border-dashed border-slate-300 dark:border-[#242424] rounded-xl text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
              <p className="font-semibold text-slate-700 dark:text-slate-300">No accounting groups available in database.</p>
              <Link
                href="/admin/groups/new"
                className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
              >
                <Plus className="h-3.5 w-3.5" />
                Create New Group
              </Link>
            </div>
          ) : (
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
                      <select
                        required
                        className="input-field text-xs font-semibold"
                        value={row.group_id}
                        onChange={(e) => updateAllocationRow(idx, "group_id", e.target.value)}
                      >
                        <option value="">-- Select Accounting Group --</option>
                        {groups.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name} ({g.code}) — Avail: {formatCurrency(g.current_balance)}
                          </option>
                        ))}
                      </select>
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
                        Allocated Capital (৳) <span className="text-rose-500">*</span>
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
                      Allocated amount exceeds available balance in {currentGroup?.name} by{" "}
                      {formatCurrency(rowAmount - groupBalance)}!
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          )}

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
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Required Principal</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">
                    {formatCurrency(parsedPrincipal)}
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
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Discrepancy</span>
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
            Strict Shariah & double-entry enforcement: Funds are debited immediately upon confirmation.
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/qard-hasan"
              className="btn-secondary text-xs"
            >
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
                  Disbursing Loan & Debiting Ledgers...
                </>
              ) : (
                <>
                  <Scale className="h-4 w-4" />
                  Disburse Qard Hasan ({formatCurrency(parsedPrincipal)})
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
