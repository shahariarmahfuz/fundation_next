"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { getFoundationTodayDate } from "@/lib/timezone";
import { CustomSelect } from "@/components/ui/custom-select";
import {
  Gift,
  HeartHandshake,
  Users,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  PlusCircle,
  List,
  Search,
  FolderTree,
  Coins,
  CreditCard,
  Calendar,
  FileText,
  Tag,
  Sparkles,
  Info
} from "lucide-react";

export default function RecordDonationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedDonorId = searchParams.get("donor_id");
  const preselectedMemberId = searchParams.get("member_id");

  // Source Type: DONOR or MEMBER
  const [sourceType, setSourceType] = useState<"DONOR" | "MEMBER">("DONOR");

  // Form Fields
  const [selectedDonorId, setSelectedDonorId] = useState<string>(preselectedDonorId || "");
  const [selectedMemberId, setSelectedMemberId] = useState<string>(preselectedMemberId || "");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [amount, setAmount] = useState<string>("5000.00");
  const [paymentMethod, setPaymentMethod] = useState<string>("BANK_TRANSFER");
  const [donationDate, setDonationDate] = useState<string>(getFoundationTodayDate());
  const [reference, setReference] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Data Collections
  const [donors, setDonors] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);

  // Search queries for dropdown selectors
  const [donorSearch, setDonorSearch] = useState("");
  const [memberSearch, setMemberSearch] = useState("");

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Success Feedback
  const [recordedDonation, setRecordedDonation] = useState<any | null>(null);
  const [showToast, setShowToast] = useState(false);

  // Fetch groups, donors, and members
  useEffect(() => {
    const fetchData = async () => {
      setLoadingInitial(true);
      try {
        const [gRes, dRes, mRes] = await Promise.all([
          api.get("/groups"),
          api.get("/donors?page=1&page_size=200"),
          api.get("/members?page=1&page_size=300"),
        ]);
        setGroups(gRes || []);
        setDonors(dRes.items || []);
        setMembers(mRes.items || []);

        if (preselectedDonorId) {
          setSourceType("DONOR");
          setSelectedDonorId(preselectedDonorId);
        } else if (preselectedMemberId) {
          setSourceType("MEMBER");
          setSelectedMemberId(preselectedMemberId);
        }
      } catch (err: any) {
        console.error("Error loading donation dependencies:", err);
      } finally {
        setLoadingInitial(false);
      }
    };

    fetchData();
  }, [preselectedDonorId, preselectedMemberId]);

  // When Member changes: auto-populate Destination Group
  useEffect(() => {
    if (sourceType === "MEMBER" && selectedMemberId) {
      const member = members.find((m) => String(m.id) === String(selectedMemberId));
      if (member) {
        if (member.group_id) {
          setSelectedGroupId(String(member.group_id));
        } else if (member.group?.id) {
          setSelectedGroupId(String(member.group.id));
        }
      }
    }
  }, [selectedMemberId, sourceType, members]);

  // Filtered lists for searchable selectors
  const filteredDonors = useMemo(() => {
    if (!donorSearch.trim()) return donors;
    const q = donorSearch.toLowerCase();
    return donors.filter(
      (d) =>
        d.name?.toLowerCase().includes(q) ||
        d.donor_number?.toLowerCase().includes(q) ||
        d.phone?.toLowerCase().includes(q) ||
        d.email?.toLowerCase().includes(q)
    );
  }, [donors, donorSearch]);

  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return members;
    const q = memberSearch.toLowerCase();
    return members.filter(
      (m) =>
        m.full_name?.toLowerCase().includes(q) ||
        m.member_number?.toLowerCase().includes(q) ||
        m.phone?.toLowerCase().includes(q)
    );
  }, [members, memberSearch]);

  // Selected Entities
  const selectedDonor = useMemo(
    () => donors.find((d) => String(d.id) === String(selectedDonorId)),
    [donors, selectedDonorId]
  );

  const selectedMember = useMemo(
    () => members.find((m) => String(m.id) === String(selectedMemberId)),
    [members, selectedMemberId]
  );

  const selectedGroup = useMemo(
    () => groups.find((g) => String(g.id) === String(selectedGroupId)),
    [groups, selectedGroupId]
  );

  // Check if current selected group matches member's own group
  const isMemberOwnGroup = useMemo(() => {
    if (sourceType !== "MEMBER" || !selectedMember || !selectedGroupId) return false;
    return (
      String(selectedMember.group_id) === String(selectedGroupId) ||
      String(selectedMember.group?.id) === String(selectedGroupId)
    );
  }, [sourceType, selectedMember, selectedGroupId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Donation amount must be strictly greater than 0");
      setSubmitting(false);
      return;
    }

    if (!selectedGroupId) {
      setError("Please select the destination Accounting Group");
      setSubmitting(false);
      return;
    }

    if (sourceType === "DONOR" && !selectedDonorId) {
      setError("Please select the contributing Donor");
      setSubmitting(false);
      return;
    }

    if (sourceType === "MEMBER" && !selectedMemberId) {
      setError("Please select the contributing Foundation Member");
      setSubmitting(false);
      return;
    }

    try {
      const payload: any = {
        source_type: sourceType,
        group_id: parseInt(selectedGroupId),
        amount: parsedAmount.toFixed(2),
        payment_method: paymentMethod,
        donation_date: donationDate,
        reference: reference.trim() || null,
        notes: notes.trim() || null,
      };

      if (sourceType === "DONOR") {
        payload.donor_id = parseInt(selectedDonorId);
        payload.member_id = null;
      } else {
        payload.member_id = parseInt(selectedMemberId);
        payload.donor_id = null;
      }

      const res = await api.post("/donations", payload);
      setRecordedDonation(res);
      setShowToast(true);

      setTimeout(() => {
        setShowToast(false);
      }, 9000);
    } catch (err: any) {
      setError(err.message || "Failed to record donation. Please review and retry.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForAnother = () => {
    setRecordedDonation(null);
    setShowToast(false);
    setError(null);
    setAmount("5000.00");
    setReference("");
    setNotes("");
    if (sourceType === "DONOR") {
      setSelectedDonorId("");
      setDonorSearch("");
    } else {
      setSelectedMemberId("");
      setMemberSearch("");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Toast Notification */}
      {showToast && recordedDonation && (
        <div className="fixed top-20 right-6 z-50 flex items-start gap-3 bg-emerald-900/95 text-white px-5 py-4 rounded-xl shadow-2xl border border-emerald-500/50 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="h-6 w-6 text-emerald-300 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold text-base text-white">Donation recorded successfully</p>
            <p className="text-emerald-100 mt-0.5">
              Receipt: <span className="font-mono font-bold text-white bg-emerald-800/80 px-2 py-0.5 rounded">{recordedDonation.donation_number}</span> • Amount: <strong className="text-white">{formatCurrency(recordedDonation.amount)}</strong>
            </p>
          </div>
        </div>
      )}

      {/* Header */}
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
                Record Donation
              </h1>
              <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <Sparkles className="h-3 w-3" />
                Dedicated Page
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Receive philanthropic funds from External Donors or Foundation Members with atomic double-entry group credit
            </p>
          </div>
        </div>

        <Link href="/admin/donations" className="btn-secondary text-xs">
          <List className="h-4 w-4" />
          Manage Donations
        </Link>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/30 p-4 text-xs sm:text-sm text-rose-800 dark:text-rose-300 animate-in fade-in">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Persistent Inline Success Card */}
      {recordedDonation && (
        <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-6 space-y-4 animate-in fade-in">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                ✓ Donation Recorded Successfully
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                The financial transaction was confirmed atomically and the group balance has been credited with exact precision.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/60 text-xs">
            <div>
              <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                Source ({recordedDonation.source_type})
              </span>
              <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                {recordedDonation.source_type === "MEMBER"
                  ? recordedDonation.member
                    ? `${recordedDonation.member.full_name} (${recordedDonation.member.member_number})`
                    : "Foundation Member"
                  : recordedDonation.donor
                  ? `${recordedDonation.donor.name} (${recordedDonation.donor.donor_number})`
                  : "External Donor"}
              </p>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                Credited Group
              </span>
              <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                {recordedDonation.group ? `${recordedDonation.group.name} (${recordedDonation.group.code})` : "Accounting Group"}
              </p>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                Amount Credited
              </span>
              <p className="text-base font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                {formatCurrency(recordedDonation.amount)}
              </p>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                Receipt Number
              </span>
              <p className="text-xs font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                {recordedDonation.donation_number}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleResetForAnother}
              className="btn-primary text-xs"
            >
              <PlusCircle className="h-4 w-4" />
              Record Another Donation
            </button>
            <Link href="/admin/donations" className="btn-secondary text-xs">
              <List className="h-4 w-4" />
              Manage Donations
            </Link>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black p-6 sm:p-8 space-y-6 shadow-sm transition-colors">
        {/* SOURCE TYPE SELECTOR */}
        <div className="space-y-3 pb-6 border-b border-slate-100 dark:border-slate-800">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Donor Type / Source <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => {
                setSourceType("DONOR");
                setError(null);
              }}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                sourceType === "DONOR"
                  ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 shadow-sm"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300"
              }`}
            >
              <HeartHandshake className={`h-6 w-6 shrink-0 ${sourceType === "DONOR" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`} />
              <div>
                <div className="font-bold text-sm">External Donor</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Registered philanthropic donor or partner entity
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setSourceType("MEMBER");
                setError(null);
              }}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                sourceType === "MEMBER"
                  ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 shadow-sm"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300"
              }`}
            >
              <Users className={`h-6 w-6 shrink-0 ${sourceType === "MEMBER" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`} />
              <div>
                <div className="font-bold text-sm">Foundation Member</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Voluntary donation by an active foundation member
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* CONDITIONAL SOURCE SELECTOR */}
        {sourceType === "DONOR" ? (
          /* DONOR SELECTOR */
          <div className="space-y-2 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Select Donor <span className="text-rose-500">*</span>
              </label>
              <Link
                href="/admin/donors/new"
                target="_blank"
                className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Add New Donor
              </Link>
            </div>

            <CustomSelect
              value={selectedDonorId}
              onChange={(val) => setSelectedDonorId(String(val))}
              options={donors.map((d) => ({
                value: String(d.id),
                label: d.name,
                sublabel: `${d.donor_number}${d.phone ? ` • ${d.phone}` : ""}`,
              }))}
              placeholder="-- Choose Donor from Database --"
              searchable={true}
              searchPlaceholder="Search donors by name, ID, phone..."
            />

            {selectedDonor && (
              <div className="mt-2 p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedDonor.name}</span>
                  <span className="ml-2 font-mono text-[11px] text-slate-500">[{selectedDonor.donor_number}]</span>
                  {selectedDonor.phone && <span className="ml-2 text-slate-400">• {selectedDonor.phone}</span>}
                </div>
                <div className="text-slate-600 dark:text-slate-400">
                  Lifetime: <strong className="text-emerald-700 dark:text-emerald-400">{formatCurrency(selectedDonor.total_donations || 0)}</strong>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* MEMBER SELECTOR */
          <div className="space-y-2 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Select Member <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">
                Donor identity will be linked to this member
              </span>
            </div>

            <CustomSelect
              value={selectedMemberId}
              onChange={(val) => setSelectedMemberId(String(val))}
              options={members.map((m) => ({
                value: String(m.id),
                label: m.full_name,
                sublabel: `${m.member_number}${m.group?.name ? ` • ${m.group.name}` : ""}${m.phone ? ` • ${m.phone}` : ""}`,
              }))}
              placeholder="-- Choose Member from Database --"
              searchable={true}
              searchPlaceholder="Search members by name, ID, phone..."
            />

            {selectedMember && (
              <div className="mt-2 p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">{selectedMember.full_name}</span>
                    <span className="ml-2 font-mono text-[11px] text-slate-500">[{selectedMember.member_number}]</span>
                  </div>
                  {selectedMember.group ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold text-[11px]">
                      <FolderTree className="h-3 w-3" />
                      Assigned Group: {selectedMember.group.name} ({selectedMember.group.code})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold text-[11px]">
                      <AlertCircle className="h-3 w-3" />
                      This member is not assigned to an accounting group
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* DESTINATION ACCOUNTING GROUP */}
        <div className="space-y-1.5 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Destination Accounting Group <span className="text-rose-500">*</span>
            </label>
            {isMemberOwnGroup && (
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <Info className="h-3 w-3" />
                Member's current group selected by default
              </span>
            )}
            {sourceType === "MEMBER" && selectedMember && !isMemberOwnGroup && selectedMember.group && (
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Custom destination group selected (differs from member's assigned group)
              </span>
            )}
          </div>

          <CustomSelect
            value={selectedGroupId}
            onChange={(val) => setSelectedGroupId(String(val))}
            options={groups.map((g) => ({
              value: String(g.id),
              label: g.name,
              sublabel: `${g.code} • Balance: ${formatCurrency(g.balance || 0)}`,
            }))}
            placeholder="-- Choose Accounting Group to Credit --"
            searchable={true}
            searchPlaceholder="Search groups..."
            icon={<FolderTree className="h-4 w-4" />}
          />
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            This group's accounting ledger balance will be credited atomically with the entire donation amount.
          </p>
        </div>

        {/* AMOUNT & FINANCIAL DETAILS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Donation Amount (BDT) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-500 font-bold">৳</span>
              <input
                required
                type="number"
                step="0.01"
                min="1"
                placeholder="5000.00"
                className="input-field pl-8 font-mono text-base font-bold text-emerald-700 dark:text-emerald-400"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Exact decimal amount to credit the group without rounding error.
            </p>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Payment Method <span className="text-rose-500">*</span>
            </label>
            <CustomSelect
              value={paymentMethod}
              onChange={(val) => setPaymentMethod(String(val))}
              options={[
                { value: "CASH", label: "CASH" },
                { value: "BANK_TRANSFER", label: "BANK TRANSFER" },
                { value: "BKASH", label: "BKASH" },
                { value: "NAGAD", label: "NAGAD" },
                { value: "ROCKET", label: "ROCKET" },
                { value: "CHEQUE", label: "CHEQUE" },
                { value: "OTHER", label: "OTHER" },
              ]}
              searchable={false}
              icon={<CreditCard className="h-4 w-4" />}
            />
          </div>

          {/* Donation Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Donation Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                required
                type="date"
                className="input-field pl-9"
                value={donationDate}
                onChange={(e) => setDonationDate(e.target.value)}
              />
            </div>
          </div>

          {/* Transaction Reference */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Transaction Reference / Cheque / Bank Slips
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. TXN-893482 or Deposit Slip #104"
                className="input-field pl-9 font-mono uppercase"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Notes & Purpose
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <textarea
                rows={2}
                placeholder="Optional notes regarding the purpose of this donation (e.g. General Fund, Building Project)..."
                className="input-field pl-9"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100 dark:border-slate-800">
          <Link href="/admin/donations" className="btn-secondary text-xs">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary text-xs"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Gift className="h-4 w-4" />
            )}
            Confirm & Record Donation
          </button>
        </div>
      </form>
    </div>
  );
}
