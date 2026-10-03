"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useFlash } from "@/lib/flash";
import { CustomSelect } from "@/components/ui/custom-select";
import {
  Coins,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  FolderTree,
  UserCheck,
  Calendar,
  CreditCard,
  FileText,
  Building2,
  ShieldCheck,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check,
  Receipt
} from "lucide-react";

interface PeriodItem {
  month: string;
  year: number;
  month_num: number;
  month_name: string;
  status: "PAID" | "DUE" | "CURRENT_PENDING" | "FUTURE";
  is_paid: boolean;
  is_selectable: boolean;
  amount: string | number;
  payment_date?: string | null;
  payment_method?: string | null;
  reference?: string | null;
  contribution_id?: number | null;
  transaction_id?: number | null;
}

interface MemberPeriodsData {
  member_id: number;
  member_name: string;
  member_number: string;
  group_id: number;
  group_name: string;
  current_month: string;
  available_years: number[];
  selected_year: number;
  periods: PeriodItem[];
  summary: {
    paid_count: number;
    due_count: number;
    current_pending_count: number;
    future_count: number;
    total_due_amount: string;
    earlier_unpaid_months?: string[];
  };
}

export default function ReceiveContributionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { flash } = useFlash();

  const [members, setMembers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Form Fields
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  // Period data from backend
  const [periodsData, setPeriodsData] = useState<MemberPeriodsData | null>(null);
  const [periodsLoading, setPeriodsLoading] = useState(false);

  // Submission & receipt state
  const [submitting, setSubmitting] = useState(false);
  const [recentSuccess, setRecentSuccess] = useState<any | null>(null);

  // Load members on mount
  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      setLoadingInitial(true);
      try {
        const [memRes, groupRes] = await Promise.all([
          api.get("/members?page=1&page_size=300&status=ACTIVE").catch(() => api.get("/members?page=1&page_size=300")),
          api.get("/groups").catch(() => []),
        ]);

        if (isMounted) {
          const loadedMembers = memRes.items || [];
          setMembers(loadedMembers);
          setGroups(groupRes || []);

          // Pre-select member if query param ?member_id is present
          const preselectId = searchParams.get("member_id");
          if (preselectId) {
            const found = loadedMembers.find((m: any) => String(m.id) === String(preselectId));
            if (found) {
              setSelectedMemberId(String(found.id));
            }
          }
        }
      } catch (err: any) {
        console.error("Failed to load initial form data", err);
      } finally {
        if (isMounted) setLoadingInitial(false);
      }
    };

    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  // Selected member object
  const selectedMember = useMemo(() => {
    if (!selectedMemberId) return null;
    return members.find((m) => String(m.id) === String(selectedMemberId)) || null;
  }, [selectedMemberId, members]);

  // Selected member's group
  const assignedGroup = useMemo(() => {
    if (!selectedMember) return null;
    if (selectedMember.group) return selectedMember.group;
    return groups.find((g) => g.id === selectedMember.group_id) || null;
  }, [selectedMember, groups]);

  // Fetch Member Periods whenever member or year changes
  const fetchMemberPeriods = useCallback(async (memId: string, yr: number) => {
    if (!memId) {
      setPeriodsData(null);
      return;
    }
    setPeriodsLoading(true);
    try {
      const res = await api.get(`/contributions/member-periods?member_id=${memId}&year=${yr}`);
      setPeriodsData(res);
    } catch (err) {
      console.error("Failed to load member contribution periods", err);
    } finally {
      setPeriodsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedMemberId) {
      fetchMemberPeriods(selectedMemberId, selectedYear);
    } else {
      setPeriodsData(null);
      setSelectedMonths([]);
    }
  }, [selectedMemberId, selectedYear, fetchMemberPeriods]);

  // Toggle Month selection
  const handleToggleMonth = (period: PeriodItem) => {
    if (period.is_paid || !period.is_selectable) return;

    setSelectedMonths((prev) => {
      if (prev.includes(period.month)) {
        return prev.filter((m) => m !== period.month);
      } else {
        return [...prev, period.month].sort();
      }
    });
  };

  // Helper: Select all DUE months in the current view
  const handleSelectAllDue = () => {
    if (!periodsData) return;
    const dueMonths = periodsData.periods
      .filter((p) => (p.status === "DUE" || p.status === "CURRENT_PENDING") && !p.is_paid)
      .map((p) => p.month);

    setSelectedMonths((prev) => {
      const merged = Array.from(new Set([...prev, ...dueMonths])).sort();
      return merged;
    });
  };

  // Helper: Select current month
  const handleSelectCurrentMonth = () => {
    if (!periodsData) return;
    const currentPeriod = periodsData.periods.find((p) => p.month === periodsData.current_month);
    if (currentPeriod && !currentPeriod.is_paid) {
      setSelectedMonths((prev) => {
        if (!prev.includes(currentPeriod.month)) {
          return [...prev, currentPeriod.month].sort();
        }
        return prev;
      });
    }
  };

  // Helper: Clear selection
  const handleClearSelection = () => {
    setSelectedMonths([]);
  };

  // Calculate rate breakdown for selected months
  const selectedBreakdown = useMemo(() => {
    if (!selectedMonths.length) return [];
    return selectedMonths.map((mStr) => {
      // Find period in loaded data if present
      const found = periodsData?.periods.find((p) => p.month === mStr);
      const amt = found ? parseFloat(String(found.amount)) : 100.0;
      const [y, m] = mStr.split("-").map(Number);
      const dateObj = new Date(y, m - 1, 1);
      const label = dateObj.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      return {
        month: mStr,
        label,
        amount: amt,
        status: found?.status || "PENDING",
      };
    });
  }, [selectedMonths, periodsData]);

  // Expected Total Amount
  const totalExpectedAmount = useMemo(() => {
    return selectedBreakdown.reduce((sum, item) => sum + item.amount, 0);
  }, [selectedBreakdown]);

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMemberId) {
      flash.warning("Missing Member", "Please select a member to receive a contribution for.");
      return;
    }

    if (selectedMonths.length === 0) {
      flash.warning("No Months Selected", "Please select at least one contribution month to record.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        member_id: parseInt(selectedMemberId, 10),
        months: selectedMonths,
        payment_method: paymentMethod,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      const res = await api.post("/contributions/receive-batch", payload);

      const memName = res.member_name || selectedMember?.full_name || `Member #${selectedMemberId}`;
      const monthsCount = res.months_count || selectedMonths.length;
      const formattedTotal = formatCurrency(parseFloat(res.total_amount));

      // Trigger animated flash toast
      flash.success(
        "Contribution Recorded Successfully",
        `Recorded ${monthsCount} month(s) (${res.months.join(", ")}) for ${memName}. Total: ${formattedTotal}. Voucher: ${res.transaction_number}`
      );

      // Save recent success card
      setRecentSuccess({
        transactionNumber: res.transaction_number,
        memberName: memName,
        memberNumber: res.member_number || selectedMember?.member_number,
        groupName: res.group_name || assignedGroup?.name,
        months: res.months,
        monthsCount,
        totalAmount: res.total_amount,
        paymentMethod: res.payment_method,
        reference: res.reference,
        timestamp: new Date().toLocaleTimeString(),
      });

      // Reset selection and form fields, keep member selected
      setSelectedMonths([]);
      setReference("");
      setNotes("");

      // Refetch periods to show updated PAID status
      await fetchMemberPeriods(selectedMemberId, selectedYear);
    } catch (err: any) {
      console.error("Failed to receive contributions", err);
      const detail = err.response?.data?.detail || err.message || "Failed to record contribution";
      flash.error("Contribution Recording Failed", detail);
    } finally {
      setSubmitting(false);
    }
  };

  // Reset all
  const handleFullReset = () => {
    setSelectedMemberId("");
    setSelectedMonths([]);
    setReference("");
    setNotes("");
    setRecentSuccess(null);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header Breadcrumbs & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
            <Link
              href="/admin/contributions"
              className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Manage Contributions
            </Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-gray-100 font-medium">Receive Contribution</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <Coins className="w-7 h-7 text-primary-600 dark:text-primary-400" />
            Receive Member Contribution
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Record single or multi-month member contributions (past dues, current, or advance) and atomically credit the member&apos;s assigned financial group.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleFullReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Form
          </button>
          <Link
            href="/admin/contributions"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors shadow-sm"
          >
            Manage Contributions
          </Link>
        </div>
      </div>

      {/* Success Notification Banner / Receipt Card */}
      {recentSuccess && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-5 shadow-sm transition-all animate-fadeIn">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/60 rounded-lg text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                  Payment Recorded Successfully!
                </h3>
                <p className="text-sm text-emerald-800 dark:text-emerald-300 mt-0.5">
                  Voucher: <span className="font-mono font-bold">{recentSuccess.transactionNumber}</span> &bull; Recorded at {recentSuccess.timestamp}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="px-2.5 py-1 bg-emerald-200/60 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 font-medium rounded-md">
                    Member: {recentSuccess.memberName} ({recentSuccess.memberNumber})
                  </span>
                  <span className="px-2.5 py-1 bg-emerald-200/60 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 font-medium rounded-md">
                    Group: {recentSuccess.groupName}
                  </span>
                  <span className="px-2.5 py-1 bg-emerald-200/60 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 font-bold rounded-md">
                    Total: {formatCurrency(parseFloat(recentSuccess.totalAmount))}
                  </span>
                  <span className="px-2.5 py-1 bg-emerald-200/60 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 font-medium rounded-md">
                    Periods: {recentSuccess.months.join(", ")}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setRecentSuccess(null)}
              className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 text-xs font-semibold px-2 py-1 rounded"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Form Grid */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Member & Contribution Period Selection (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Member Selection Card */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <UserCheck className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              1. Select Member &amp; Assigned Group
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Select Member <span className="text-red-500">*</span>
                </label>
                {loadingInitial ? (
                  <div className="flex items-center gap-2 py-2 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                    Loading members...
                  </div>
                ) : (
                  <CustomSelect
                    required
                    value={selectedMemberId}
                    onChange={(val) => setSelectedMemberId(String(val))}
                    options={members.map((m) => ({
                      value: String(m.id),
                      label: m.full_name,
                      sublabel: `(${m.member_number})${m.phone ? ` — ${m.phone}` : ""}`,
                    }))}
                    placeholder="-- Choose Member --"
                    emptyMessage="No members found"
                    searchable={true}
                    searchPlaceholder="Search member name, ID, or phone..."
                  />
                )}
              </div>

              {/* Automatic Assigned Group Display */}
              {selectedMember && (
                <div className="p-4 bg-primary-50/50 dark:bg-primary-950/20 border border-primary-100 dark:border-primary-900/50 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 rounded-lg">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-primary-700 dark:text-primary-300 uppercase tracking-wider">
                        Assigned Financial Group
                      </div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        {assignedGroup?.name || "General Group"}
                        <span className="ml-2 text-xs font-mono font-normal text-gray-500 dark:text-gray-400">
                          ({assignedGroup?.code || "GEN"})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Auto-Credited to Group
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. Contribution Periods Multi-Month Selector Card */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  2. Contribution Periods (Multi-Month Selection)
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Select any combination of previous unpaid dues, current month, or future advance months.
                </p>
              </div>

              {/* Year Navigation */}
              {periodsData && (
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setSelectedYear((y) => y - 1)}
                    className="p-1 hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded transition-colors"
                    title="Previous Year"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 text-xs font-bold text-gray-900 dark:text-white">
                    {selectedYear}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedYear((y) => y + 1)}
                    className="p-1 hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded transition-colors"
                    title="Next Year"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* If no member selected */}
            {!selectedMemberId && (
              <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                <Calendar className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                Please select a member above to inspect and select contribution periods.
              </div>
            )}

            {/* Loading state for periods */}
            {selectedMemberId && periodsLoading && (
              <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400 flex flex-col items-center justify-center">
                <Loader2 className="w-7 h-7 animate-spin text-primary-600 mb-2" />
                Loading {selectedMember?.full_name}&apos;s contribution periods...
              </div>
            )}

            {/* Periods loaded */}
            {selectedMemberId && !periodsLoading && periodsData && (
              <div className="space-y-4">
                {/* Earlier Unpaid Warning if exists */}
                {periodsData.summary.earlier_unpaid_months &&
                  periodsData.summary.earlier_unpaid_months.length > 0 && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span>
                          Member has <strong>{periodsData.summary.earlier_unpaid_months.length}</strong> unpaid month(s) from earlier years: {periodsData.summary.earlier_unpaid_months.join(", ")}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedYear(parseInt(periodsData.summary.earlier_unpaid_months![0].split("-")[0]))}
                        className="text-xs font-semibold text-amber-900 dark:text-amber-200 underline ml-2 whitespace-nowrap"
                      >
                        View Earlier Year
                      </button>
                    </div>
                  )}

                {/* Quick Selection Tool Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 dark:text-gray-400 font-medium">Quick select:</span>
                    <button
                      type="button"
                      onClick={handleSelectAllDue}
                      className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded font-semibold hover:bg-amber-200 dark:hover:bg-amber-800/60 transition-colors"
                    >
                      Select All Due
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectCurrentMonth}
                      className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded font-semibold hover:bg-blue-200 dark:hover:bg-blue-800/60 transition-colors"
                    >
                      Select Current Month
                    </button>
                  </div>

                  {selectedMonths.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearSelection}
                      className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 font-medium transition-colors"
                    >
                      Clear Selection ({selectedMonths.length})
                    </button>
                  )}
                </div>

                {/* 12 Months Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {periodsData.periods.map((period) => {
                    const isSelected = selectedMonths.includes(period.month);
                    const isPaid = period.is_paid;
                    const isDue = period.status === "DUE";
                    const isCurrent = period.status === "CURRENT_PENDING";
                    const isFuture = period.status === "FUTURE";

                    return (
                      <div
                        key={period.month}
                        onClick={() => handleToggleMonth(period)}
                        className={`relative p-3.5 rounded-xl border transition-all text-left select-none ${
                          isPaid
                            ? "bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-800 opacity-60 cursor-not-allowed"
                            : isSelected
                            ? "bg-primary-50 dark:bg-primary-950/40 border-primary-500 ring-2 ring-primary-500 dark:ring-primary-400 shadow-sm cursor-pointer"
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm cursor-pointer"
                        }`}
                      >
                        {/* Top Row: Month Name & Checkbox/Paid Icon */}
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="font-semibold text-sm text-gray-900 dark:text-white">
                            {period.month_name.slice(0, 3)} {period.year}
                          </span>

                          {isPaid ? (
                            <span className="text-emerald-600 dark:text-emerald-400">
                              <Check className="w-4 h-4 stroke-[3]" />
                            </span>
                          ) : (
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                isSelected
                                  ? "bg-primary-600 border-primary-600 text-white"
                                  : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          )}
                        </div>

                        {/* Amount */}
                        <div className="text-xs font-mono text-gray-700 dark:text-gray-300 mb-2">
                          {formatCurrency(parseFloat(String(period.amount)))}
                        </div>

                        {/* Status Badge */}
                        <div>
                          {isPaid && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                              ✓ PAID
                            </span>
                          )}
                          {isDue && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                              ● DUE
                            </span>
                          )}
                          {isCurrent && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
                              ● CURRENT
                            </span>
                          )}
                          {isFuture && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/50">
                              ○ ADVANCE
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Status Legend */}
                <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>Paid (Locked)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span>Past Due</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    <span>Current Month</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                    <span>Future / Advance</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Payment Details & Summary (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Summary & Breakdown Card */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              Payment Summary
            </h2>

            {/* Selected Breakdown Box */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
              <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                <span>Selected Periods:</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {selectedMonths.length} {selectedMonths.length === 1 ? "month" : "months"}
                </span>
              </div>

              {selectedBreakdown.length > 0 ? (
                <div className="max-h-44 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700 text-xs pr-1">
                  {selectedBreakdown.map((item) => (
                    <div key={item.month} className="py-1.5 flex justify-between items-center">
                      <span className="font-medium text-gray-800 dark:text-gray-200">{item.label}</span>
                      <span className="font-mono text-gray-600 dark:text-gray-400">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-400 dark:text-gray-500 py-3 text-center italic">
                  No contribution periods selected yet.
                </div>
              )}

              <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <span className="text-sm font-bold text-gray-900 dark:text-white">Total Due:</span>
                <span className="text-lg font-bold font-mono text-primary-600 dark:text-primary-400">
                  {formatCurrency(totalExpectedAmount)}
                </span>
              </div>
            </div>

            {/* Payment Fields */}
            <div className="space-y-4 pt-2">
              {/* Payment Method */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <CustomSelect
                  required
                  value={paymentMethod}
                  onChange={(val) => setPaymentMethod(String(val))}
                  options={[
                    { value: "CASH", label: "CASH (Physical Receipt)" },
                    { value: "BANK_TRANSFER", label: "BANK TRANSFER" },
                    { value: "BKASH", label: "bKash Mobile Banking" },
                    { value: "NAGAD", label: "Nagad Mobile Banking" },
                    { value: "OTHER", label: "OTHER PAYMENT METHOD" },
                  ]}
                  icon={<CreditCard className="w-4 h-4" />}
                  searchable={false}
                />
              </div>

              {/* Reference */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Transaction Ref / Receipt #
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. TR-998822 or Receipt 042"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all placeholder:text-gray-400"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Internal Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Optional remarks regarding this contribution..."
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Submission Action Buttons */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-2.5">
              <button
                type="submit"
                disabled={submitting || selectedMonths.length === 0 || !selectedMemberId}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow transition-all"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Recording {selectedMonths.length} Month(s)...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Record Contribution ({selectedMonths.length > 0 ? formatCurrency(totalExpectedAmount) : "৳0.00"})
                  </>
                )}
              </button>

              <Link
                href="/admin/contributions"
                className="w-full inline-flex items-center justify-center px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
