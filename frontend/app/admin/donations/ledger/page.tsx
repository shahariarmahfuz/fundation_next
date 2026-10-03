"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Pagination } from "@/components/Pagination";
import { StatusBadge } from "@/components/StatusBadge";
import { CustomSelect } from "@/components/ui/custom-select";
import {
  Gift,
  HeartHandshake,
  Users,
  FolderTree,
  ArrowLeft,
  Calendar,
  Filter,
  Printer,
  Loader2,
  AlertCircle,
  Search,
  X,
  CreditCard,
  RefreshCw,
  Coins
} from "lucide-react";

export default function DonationsLedgerPage() {
  const [donations, setDonations] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [donors, setDonors] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Filters State
  const [search, setSearch] = useState("");
  const [sourceTypeFilter, setSourceTypeFilter] = useState("");
  const [selectedDonorId, setSelectedDonorId] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load dropdown dependency collections
  useEffect(() => {
    const fetchDependencies = async () => {
      try {
        const [groupsRes, donorsRes, membersRes] = await Promise.all([
          api.get("/groups"),
          api.get("/donors?page=1&page_size=300"),
          api.get("/members?page=1&page_size=500"),
        ]);
        setGroups(groupsRes || []);
        setDonors(donorsRes?.items || []);
        setMembers(membersRes?.items || []);
      } catch (err: any) {
        console.error("Failed to load dependency filters:", err);
      }
    };
    fetchDependencies();
  }, []);

  // Fetch ledger data
  const fetchLedger = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });

      if (search.trim()) params.append("search", search.trim());
      if (sourceTypeFilter) params.append("source_type", sourceTypeFilter);
      if (selectedDonorId) params.append("donor_id", selectedDonorId);
      if (selectedMemberId) params.append("member_id", selectedMemberId);
      if (selectedGroupId) params.append("group_id", selectedGroupId);
      if (selectedPaymentMethod) params.append("payment_method", selectedPaymentMethod);
      if (dateFrom) params.append("from_date", dateFrom);
      if (dateTo) params.append("to_date", dateTo);

      const res = await api.get(`/donations?${params.toString()}`);
      setDonations(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.total_pages || 1);
    } catch (err: any) {
      setError(err.message || "Failed to load donations ledger. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [
    page,
    pageSize,
    sourceTypeFilter,
    selectedDonorId,
    selectedMemberId,
    selectedGroupId,
    selectedPaymentMethod,
    dateFrom,
    dateTo,
  ]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLedger();
  };

  const handleClearFilters = () => {
    setSearch("");
    setSourceTypeFilter("");
    setSelectedDonorId("");
    setSelectedMemberId("");
    setSelectedGroupId("");
    setSelectedPaymentMethod("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  // Determine count of active non-default filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (search.trim()) count++;
    if (sourceTypeFilter) count++;
    if (selectedDonorId) count++;
    if (selectedMemberId) count++;
    if (selectedGroupId) count++;
    if (selectedPaymentMethod) count++;
    if (dateFrom) count++;
    if (dateTo) count++;
    return count;
  }, [
    search,
    sourceTypeFilter,
    selectedDonorId,
    selectedMemberId,
    selectedGroupId,
    selectedPaymentMethod,
    dateFrom,
    dateTo,
  ]);

  const handlePrint = () => {
    window.print();
  };

  // Summary Metrics
  const pageTotalAmount = useMemo(() => {
    return donations.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
  }, [donations]);

  const donorDonationsCount = useMemo(() => {
    return donations.filter((d) => d.source_type === "DONOR").length;
  }, [donations]);

  const memberDonationsCount = useMemo(() => {
    return donations.filter((d) => d.source_type === "MEMBER").length;
  }, [donations]);

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/donations"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Donation Ledger
              </h1>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                {total} Records
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Chronological accounting journal of all philanthropic donations received across foundation groups
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLedger}
            disabled={loading}
            className="btn-secondary text-xs inline-flex items-center gap-1.5"
            title="Refresh Ledger"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={handlePrint}
            className="btn-secondary text-xs inline-flex items-center gap-1.5"
          >
            <Printer className="h-4 w-4" />
            Print Ledger
          </button>
          <Link
            href="/admin/donations/new"
            className="btn-primary text-xs inline-flex items-center gap-1.5"
          >
            <Gift className="h-4 w-4" />
            Record Donation
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A0A0A] p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Page Inflow Total</span>
            <Coins className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            {formatCurrency(pageTotalAmount)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Sum of current page entries</span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A0A0A] p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Total Ledger Entries</span>
            <Gift className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            {total}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Matching active search & filters</span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A0A0A] p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>External Donors</span>
            <HeartHandshake className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 font-mono">
            {donorDonationsCount}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">On this page</span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A0A0A] p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Foundation Members</span>
            <Users className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-sky-700 dark:text-sky-400 font-mono">
            {memberDonationsCount}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">On this page</span>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/30 p-4 text-xs sm:text-sm text-rose-800 dark:text-rose-300">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchLedger}
            className="btn-secondary text-xs !py-1 !px-2.5"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter Control Center */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A0A0A] p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            <Filter className="h-4 w-4 text-emerald-600" />
            Ledger Filters
            {activeFilterCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono font-bold">
                {activeFilterCount} active
              </span>
            )}
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={handleClearFilters}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Reset All Filters
            </button>
          )}
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by Donation ID, reference, contributor name, code, or description notes..."
            className="input-field pl-10 text-xs sm:text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        {/* Filter Selectors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Source Type Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Source Type
            </label>
            <CustomSelect
              value={sourceTypeFilter}
              onChange={(val) => {
                setSourceTypeFilter(String(val));
                setPage(1);
              }}
              options={[
                { value: "", label: "All Sources" },
                { value: "DONOR", label: "External Donors" },
                { value: "MEMBER", label: "Foundation Members" },
              ]}
              searchable={false}
            />
          </div>

          {/* Group Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Accounting Group
            </label>
            <CustomSelect
              value={selectedGroupId}
              onChange={(val) => {
                setSelectedGroupId(String(val));
                setPage(1);
              }}
              options={[
                { value: "", label: "All Groups" },
                ...groups.map((g) => ({
                  value: String(g.id),
                  label: g.name,
                  sublabel: g.code,
                })),
              ]}
              searchable={true}
            />
          </div>

          {/* Donor Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Donor
            </label>
            <CustomSelect
              value={selectedDonorId}
              onChange={(val) => {
                setSelectedDonorId(String(val));
                if (val) setSourceTypeFilter("DONOR");
                setPage(1);
              }}
              options={[
                { value: "", label: "All Donors" },
                ...donors.map((d) => ({
                  value: String(d.id),
                  label: d.name,
                  sublabel: d.donor_number,
                })),
              ]}
              searchable={true}
            />
          </div>

          {/* Member Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Member
            </label>
            <CustomSelect
              value={selectedMemberId}
              onChange={(val) => {
                setSelectedMemberId(String(val));
                if (val) setSourceTypeFilter("MEMBER");
                setPage(1);
              }}
              options={[
                { value: "", label: "All Members" },
                ...members.map((m) => ({
                  value: String(m.id),
                  label: m.full_name,
                  sublabel: m.member_number,
                })),
              ]}
              searchable={true}
            />
          </div>

          {/* Payment Method Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Payment Method
            </label>
            <CustomSelect
              value={selectedPaymentMethod}
              onChange={(val) => {
                setSelectedPaymentMethod(String(val));
                setPage(1);
              }}
              options={[
                { value: "", label: "All Methods" },
                { value: "CASH", label: "CASH" },
                { value: "BANK_TRANSFER", label: "BANK TRANSFER" },
                { value: "BKASH", label: "BKASH" },
                { value: "NAGAD", label: "NAGAD" },
                { value: "OTHER", label: "OTHER" },
              ]}
              searchable={false}
            />
          </div>

          {/* Date Range: From & To */}
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                From Date
              </label>
              <input
                type="date"
                className="input-field text-xs !px-1.5"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                To Date
              </label>
              <input
                type="date"
                className="input-field text-xs !px-1.5"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Table Presentation */}
      <div className="hidden md:block">
        <div className="table-container">
          <table className="table-custom">
            <thead>
              <tr>
                <th>Donation ID / Ref</th>
                <th>Date</th>
                <th>Source Type</th>
                <th>Donor / Member Name</th>
                <th>Source Accounting Group</th>
                <th>Method</th>
                <th>Description / Notes</th>
                <th className="text-right">Amount</th>
                <th className="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-600" />
                    <span className="mt-2 block text-xs text-slate-400">Loading donation ledger...</span>
                  </td>
                </tr>
              ) : donations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-slate-500 dark:text-slate-400">
                    <Gift className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                    <p className="font-semibold text-sm">No donation transactions found</p>
                    <p className="text-xs text-slate-400 mt-1">Try resetting or broadening your filter criteria.</p>
                    {activeFilterCount > 0 && (
                      <button
                        onClick={handleClearFilters}
                        className="btn-secondary text-xs mt-3 !py-1.5 !px-3"
                      >
                        Reset All Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                donations.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 dark:hover:bg-[#121212] transition-colors">
                    {/* Donation ID / Reference */}
                    <td>
                      <div className="font-mono text-xs font-bold text-slate-900 dark:text-[#F5F5F5]">
                        {d.donation_number}
                      </div>
                      {d.reference && (
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 truncate max-w-[140px]" title={d.reference}>
                          Ref: {d.reference}
                        </div>
                      )}
                    </td>

                    {/* Date */}
                    <td className="text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {formatDate(d.donation_date)}
                    </td>

                    {/* Source Type */}
                    <td>
                      {d.source_type === "MEMBER" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                          <Users className="h-3 w-3" />
                          Member
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <HeartHandshake className="h-3 w-3" />
                          Donor
                        </span>
                      )}
                    </td>

                    {/* Donor / Member Name */}
                    <td>
                      {d.source_type === "MEMBER" ? (
                        d.member ? (
                          <Link
                            href={`/admin/members/${d.member.id}`}
                            className="group block text-xs"
                          >
                            <div className="font-semibold text-slate-900 dark:text-[#F5F5F5] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              {d.member.full_name}
                            </div>
                            <div className="font-mono text-[11px] text-slate-400">
                              {d.member.member_number}
                            </div>
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-500">Member #{d.member_id}</span>
                        )
                      ) : d.donor ? (
                        <Link
                          href={`/admin/donors/${d.donor.id}`}
                          className="group block text-xs"
                        >
                          <div className="font-semibold text-slate-900 dark:text-[#F5F5F5] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {d.donor.name}
                          </div>
                          <div className="font-mono text-[11px] text-slate-400">
                            {d.donor.donor_number}
                          </div>
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-500">External Donor</span>
                      )}
                    </td>

                    {/* Source Accounting Group */}
                    <td>
                      <Link
                        href={`/admin/groups/${d.group?.id || d.group_id}`}
                        className="inline-flex items-center gap-1.5 text-xs group"
                      >
                        <FolderTree className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 transition-colors">
                          {d.group?.name || `Group #${d.group_id}`}
                        </span>
                        {d.group?.code && (
                          <span className="font-mono text-[10px] text-slate-400">
                            ({d.group.code})
                          </span>
                        )}
                      </Link>
                    </td>

                    {/* Payment Method */}
                    <td>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-[#151515] text-slate-700 dark:text-slate-300 font-mono">
                        <CreditCard className="h-3 w-3" />
                        {d.payment_method?.replace(/_/g, " ")}
                      </span>
                    </td>

                    {/* Description / Notes */}
                    <td className="text-xs text-slate-600 dark:text-slate-400 max-w-xs truncate" title={d.notes || d.reference || ""}>
                      {d.notes || d.reference || "—"}
                    </td>

                    {/* Amount */}
                    <td className="text-right">
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm font-mono">
                        +{formatCurrency(d.amount)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="text-center">
                      <StatusBadge status={d.status || "COMPLETED"} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Responsive Cards Presentation */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="text-center py-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A0A0A]">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-600" />
            <span className="mt-2 block text-xs text-slate-400">Loading donation ledger...</span>
          </div>
        ) : donations.length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A0A0A] p-4 text-slate-500">
            <Gift className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
            <p className="font-semibold text-sm">No donation transactions found</p>
            {activeFilterCount > 0 && (
              <button
                onClick={handleClearFilters}
                className="btn-secondary text-xs mt-3 !py-1.5 !px-3"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          donations.map((d) => (
            <div
              key={d.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A0A0A] p-4 space-y-3 shadow-xs"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <div>
                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                    {d.donation_number}
                  </span>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {formatDate(d.donation_date)}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={d.status || "COMPLETED"} />
                  <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                    +{formatCurrency(d.amount)}
                  </span>
                </div>
              </div>

              {/* Contributor & Source */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                    Contributor
                  </span>
                  {d.source_type === "MEMBER" ? (
                    <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                      {d.member?.full_name || `Member #${d.member_id}`}
                      <span className="block font-mono text-[10px] text-slate-400">
                        {d.member?.member_number}
                      </span>
                    </div>
                  ) : (
                    <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                      {d.donor?.name || `Donor #${d.donor_id}`}
                      <span className="block font-mono text-[10px] text-slate-400">
                        {d.donor?.donor_number}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                    Source Type
                  </span>
                  <div className="mt-1">
                    {d.source_type === "MEMBER" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                        <Users className="h-2.5 w-2.5" />
                        Member
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <HeartHandshake className="h-2.5 w-2.5" />
                        Donor
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Group & Method */}
              <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 dark:border-slate-800/80 pt-2">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                    Credited Group
                  </span>
                  <div className="font-medium text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                    {d.group?.name || `Group #${d.group_id}`}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                    Payment Method
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 font-mono mt-0.5">
                    {d.payment_method?.replace(/_/g, " ")}
                  </span>
                </div>
              </div>

              {/* Notes or Reference */}
              {(d.notes || d.reference) && (
                <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#121212] p-2 rounded-lg">
                  {d.reference && (
                    <span className="font-mono text-[10px] text-slate-400 block mb-0.5">
                      Ref: {d.reference}
                    </span>
                  )}
                  {d.notes && <span>{d.notes}</span>}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        onPageChange={(p) => setPage(p)}
        onPageSizeChange={(ps) => {
          setPageSize(ps);
          setPage(1);
        }}
      />
    </div>
  );
}
