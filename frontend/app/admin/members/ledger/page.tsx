"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Users,
  Search,
  Printer,
  Coins,
  ExternalLink,
  Loader2,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight
} from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const s = (status || "").toUpperCase();
  if (s === "PAID" || s === "COMPLETED" || s === "APPROVED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
        <CheckCircle2 className="h-3 w-3" />
        {status}
      </span>
    );
  }
  if (s === "PENDING" || s === "PARTIAL") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
        <Clock className="h-3 w-3" />
        {status}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
      {status || "UNKNOWN"}
    </span>
  );
}

function MemberLedgerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMemberId = searchParams.get("member_id") || "";

  const [members, setMembers] = useState<any[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>(initialMemberId);
  const [searchQuery, setSearchQuery] = useState("");
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState<string | null>(null);

  const [ledgerData, setLedgerData] = useState<any | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerError, setLedgerError] = useState<string | null>(null);

  // Load members list
  const loadMembers = async () => {
    setMembersLoading(true);
    setMembersError(null);
    try {
      const res = await api.get("/members?page=1&page_size=500");
      const list = res.items || [];
      setMembers(list);

      // If no initial member selected, default to first member
      if (!selectedMemberId && list.length > 0) {
        setSelectedMemberId(String(list[0].id));
      }
    } catch (err: any) {
      setMembersError(err.message || "Failed to load members list");
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  // Fetch member ledger when selectedMemberId changes
  const fetchLedger = async (memId: string) => {
    if (!memId) return;
    setLedgerLoading(true);
    setLedgerError(null);
    try {
      const data = await api.get(`/reports/member-ledger/${memId}`);
      setLedgerData(data);
    } catch (err: any) {
      setLedgerError(err.message || "Failed to fetch member ledger");
      setLedgerData(null);
    } finally {
      setLedgerLoading(false);
    }
  };

  useEffect(() => {
    if (selectedMemberId) {
      fetchLedger(selectedMemberId);
    }
  }, [selectedMemberId]);

  // Filter members for selection dropdown / search
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const q = searchQuery.toLowerCase().trim();
    return members.filter(
      (m) =>
        (m.full_name && m.full_name.toLowerCase().includes(q)) ||
        (m.member_number && m.member_number.toLowerCase().includes(q)) ||
        (m.phone && m.phone.toLowerCase().includes(q)) ||
        (m.group?.code && m.group.code.toLowerCase().includes(q))
    );
  }, [members, searchQuery]);

  const selectedMember = useMemo(() => {
    return members.find((m) => String(m.id) === String(selectedMemberId));
  }, [members, selectedMemberId]);

  const handleSelectMember = (id: string) => {
    setSelectedMemberId(id);
    const params = new URLSearchParams(window.location.search);
    params.set("member_id", id);
    router.replace(`/admin/members/ledger?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Member Contribution Ledger
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Individual contribution history, agreed monthly rates, credited balances, and outstanding dues
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          {selectedMemberId && (
            <Link
              href={`/admin/contributions/receive?member_id=${selectedMemberId}`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
            >
              <Coins className="h-4 w-4" />
              Receive Contribution
            </Link>
          )}

          {selectedMemberId && (
            <Link
              href={`/admin/members/${selectedMemberId}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
            >
              <ExternalLink className="h-4 w-4 text-slate-400" />
              Member Profile
            </Link>
          )}

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Printer className="h-4 w-4" />
            Print Ledger
          </button>
        </div>
      </div>

      {/* Member Selection Control */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs print:hidden transition-colors">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 items-end">
          {/* Search Filter */}
          <div className="md:col-span-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Filter Member
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, ID, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Member Dropdown Picker */}
          <div className="md:col-span-8">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Select Member ({filteredMembers.length} available)
            </label>
            {membersLoading ? (
              <div className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-xs text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                Loading members directory...
              </div>
            ) : membersError ? (
              <div className="flex h-10 items-center justify-between rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-900/40 dark:bg-rose-950/20 px-3 text-xs text-rose-700 dark:text-rose-400">
                <span>{membersError}</span>
                <button
                  onClick={loadMembers}
                  className="font-semibold underline hover:no-underline ml-2"
                >
                  Retry
                </button>
              </div>
            ) : (
              <select
                value={selectedMemberId}
                onChange={(e) => handleSelectMember(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm font-medium text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:outline-none"
              >
                {filteredMembers.length === 0 ? (
                  <option value="">No matching members found</option>
                ) : (
                  filteredMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      [{m.member_number}] {m.full_name} — {m.group?.name ? `${m.group.name} (${m.group.code})` : "Unassigned"}
                    </option>
                  ))
                )}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Ledger Content Area */}
      {ledgerLoading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Loader2 className="h-9 w-9 animate-spin text-emerald-600" />
          <span className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">
            Compiling member statement & contribution history...
          </span>
        </div>
      ) : ledgerError ? (
        <div className="rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 p-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-600 dark:text-rose-400" />
          <p className="mt-2 text-sm font-medium text-rose-800 dark:text-rose-300">{ledgerError}</p>
          <button
            onClick={() => fetchLedger(selectedMemberId)}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 transition-colors"
          >
            Retry Loading Ledger
          </button>
        </div>
      ) : ledgerData ? (
        <div className="space-y-6">
          {/* Key Metrics / Profile Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-colors">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Member Information
              </div>
              <div className="mt-1 text-lg font-bold text-slate-900 dark:text-white truncate">
                {ledgerData.member_name}
              </div>
              <div className="text-xs font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                {ledgerData.member_number} • Group: {ledgerData.group_name || "Unassigned"}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-colors">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Agreed Monthly Rate
              </div>
              <div className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(ledgerData.monthly_rate)}
              </div>
              <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Monthly commitment obligation</div>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 shadow-xs dark:border-emerald-900/40 dark:bg-emerald-950/20 transition-colors">
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Total Paid Contributions
              </div>
              <div className="mt-1 text-xl font-bold text-emerald-700 dark:text-emerald-400">
                {formatCurrency(ledgerData.total_paid)}
              </div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400/80 mt-0.5">Credited to group fund</div>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5 shadow-xs dark:border-amber-900/40 dark:bg-amber-950/20 transition-colors">
              <div className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Total Outstanding Dues
              </div>
              <div className="mt-1 text-xl font-bold text-amber-700 dark:text-amber-400">
                {formatCurrency(ledgerData.total_due)}
              </div>
              <div className="text-xs text-amber-600 dark:text-amber-400/80 mt-0.5">Pending or unpaid balance</div>
            </div>
          </div>

          {/* Historical Contribution Entries Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs transition-colors">
            <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Monthly Contribution & Payment History
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Complete chronological ledger of contribution credits and transaction references
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {ledgerData.entries?.length || 0} Transactions
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Date</th>
                    <th className="px-6 py-3 font-semibold">Classification</th>
                    <th className="px-6 py-3 font-semibold">Description</th>
                    <th className="px-6 py-3 font-semibold text-right">Amount</th>
                    <th className="px-6 py-3 font-semibold text-center">Status</th>
                    <th className="px-6 py-3 font-semibold">Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {!ledgerData.entries || ledgerData.entries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                        <Coins className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
                        No contribution entries recorded for this member yet.
                      </td>
                    </tr>
                  ) : (
                    ledgerData.entries.map((entry: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {formatDate(entry.date)}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">
                          {entry.type}
                        </td>
                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                          {entry.description}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          {formatCurrency(entry.amount)}
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <StatusBadge status={entry.status} />
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-slate-400 dark:text-slate-500 whitespace-nowrap">
                          {entry.reference || "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
          <Users className="h-10 w-10 text-slate-400 dark:text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No Member Selected</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
            Select a foundation member from the dropdown above to view their contribution ledger.
          </p>
        </div>
      )}
    </div>
  );
}

export default function MemberLedgerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <MemberLedgerContent />
    </Suspense>
  );
}
