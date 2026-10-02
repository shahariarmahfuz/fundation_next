"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import { Modal } from "@/components/Modal";
import {
  User,
  ArrowLeft,
  FolderTree,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Coins,
  CheckCircle2,
  Clock,
  PlusCircle,
  Loader2,
  AlertCircle
} from "lucide-react";

export default function MemberProfilePage() {
  const params = useParams();
  const router = useRouter();
  const memberId = params.id as string;

  const [member, setMember] = useState<any | null>(null);
  const [ledger, setLedger] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pay modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [payMonth, setPayMonth] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("CASH");
  const [payRef, setPayRef] = useState("");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const fetchMemberData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [m, l] = await Promise.all([
        api.get(`/members/${memberId}`),
        api.get(`/reports/member-ledger/${memberId}`),
      ]);
      setMember(m);
      setLedger(l);
      setPayAmount(String(m.monthly_contribution_amount));
      const currentMonth = new Date().toISOString().slice(0, 7);
      setPayMonth(currentMonth);
    } catch (err: any) {
      setError(err.message || "Failed to load member data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemberData();
  }, [memberId]);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaying(true);
    setPayError(null);
    try {
      await api.post("/contributions", {
        member_id: parseInt(memberId),
        contribution_month: payMonth,
        amount: parseFloat(payAmount) || member.monthly_contribution_amount,
        payment_method: payMethod,
        reference: payRef,
      });
      setIsModalOpen(false);
      fetchMemberData();
    } catch (err: any) {
      setPayError(err.message || "Failed to record contribution");
    } finally {
      setPaying(false);
    }
  };

  if (loading && !member) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-foundation-700" />
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="space-y-4">
        <Link href="/admin/members" className="btn-secondary">
          <ArrowLeft className="h-4 w-4" />
          Back to Members
        </Link>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
          {error || "Member not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/members"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {member.full_name}
              </h1>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                {member.member_number}
              </span>
              <StatusBadge status={member.status} />
            </div>
            <p className="text-xs text-slate-500">
              Joined on {formatDate(member.joining_date)}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
        >
          <PlusCircle className="h-4 w-4" />
          Record Contribution
        </button>
      </div>

      {/* Member Details & Financial Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Info Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Member Information
          </h3>

          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <FolderTree className="h-4 w-4 text-foundation-700 shrink-0" />
              <span>Group:</span>
              <strong className="text-slate-900">
                {member.group?.name} ({member.group?.code})
              </strong>
            </div>

            <div className="flex items-center gap-2 text-slate-600">
              <Phone className="h-4 w-4 text-foundation-700 shrink-0" />
              <span>Phone:</span>
              <strong className="text-slate-900">{member.phone}</strong>
            </div>

            {member.email && (
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="h-4 w-4 text-foundation-700 shrink-0" />
                <span>Email:</span>
                <span className="text-slate-900">{member.email}</span>
              </div>
            )}

            {member.nid_or_id && (
              <div className="flex items-center gap-2 text-slate-600">
                <User className="h-4 w-4 text-foundation-700 shrink-0" />
                <span>NID/ID:</span>
                <span className="text-slate-900 font-mono">{member.nid_or_id}</span>
              </div>
            )}

            {member.address && (
              <div className="flex items-start gap-2 text-slate-600">
                <MapPin className="h-4 w-4 text-foundation-700 shrink-0 mt-0.5" />
                <span>Address:</span>
                <span className="text-slate-900">{member.address}</span>
              </div>
            )}
          </div>

          {member.notes && (
            <div className="pt-3 border-t border-slate-100 text-xs text-slate-500">
              <strong>Notes:</strong> {member.notes}
            </div>
          )}
        </div>

        {/* Right: Financial Status */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col justify-between">
            <div>
              <span className="text-xs text-slate-500">Monthly Contribution Rate</span>
              <div className="mt-1 text-2xl font-bold text-slate-900">
                {formatCurrency(member.monthly_contribution_amount)}
              </div>
            </div>
            <span className="text-[11px] text-slate-400 mt-2">Obligatory monthly amount</span>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 flex flex-col justify-between">
            <div>
              <span className="text-xs text-emerald-800 font-medium">Total Paid to Group</span>
              <div className="mt-1 text-2xl font-bold text-emerald-900">
                {formatCurrency(ledger?.total_paid)}
              </div>
            </div>
            <span className="text-[11px] text-emerald-700 mt-2">Credited to {member.group?.code}</span>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 flex flex-col justify-between">
            <div>
              <span className="text-xs text-amber-800 font-medium">Outstanding Dues</span>
              <div className="mt-1 text-2xl font-bold text-amber-900">
                {formatCurrency(ledger?.total_due)}
              </div>
            </div>
            <span className="text-[11px] text-amber-700 mt-2">Pending/Due records</span>
          </div>
        </div>
      </div>

      {/* Member Contribution Ledger Table */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900">Member Contribution Ledger</h3>

        <div className="table-container">
          <table className="table-custom">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Reference</th>
                <th>Status</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {!ledger?.entries || ledger.entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    No contribution records generated yet for this member.
                  </td>
                </tr>
              ) : (
                ledger.entries.map((e: any, idx: number) => (
                  <tr key={idx}>
                    <td className="text-xs text-slate-600">{formatDate(e.date)}</td>
                    <td className="font-medium text-xs text-slate-900">{e.description}</td>
                    <td className="font-mono text-xs text-slate-500">{e.reference || "-"}</td>
                    <td>
                      <StatusBadge status={e.status} />
                    </td>
                    <td
                      className={`text-right font-semibold text-xs ${
                        e.status === "PAID" ? "text-emerald-700" : "text-amber-700"
                      }`}
                    >
                      {formatCurrency(e.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Record Contribution */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Record Contribution — ${member.full_name}`}
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          {payError && (
            <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              {payError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Contribution Month (YYYY-MM) <span className="text-rose-500">*</span>
            </label>
            <input
              required
              type="month"
              className="input-field"
              value={payMonth}
              onChange={(e) => setPayMonth(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Amount (৳ BDT) <span className="text-rose-500">*</span>
            </label>
            <input
              required
              type="number"
              step="50"
              className="input-field"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Will be deposited directly into <strong>{member.group?.name}</strong>.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Method
            </label>
            <select
              className="input-field"
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
            >
              <option value="CASH">CASH</option>
              <option value="BKASH">BKASH</option>
              <option value="NAGAD">NAGAD</option>
              <option value="BANK_TRANSFER">BANK TRANSFER</option>
              <option value="OTHER">OTHER</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reference / Trx ID
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. BK-TRX-9872"
              value={payRef}
              onChange={(e) => setPayRef(e.target.value)}
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={paying} className="btn-primary">
              {paying && <Loader2 className="h-4 w-4 animate-spin" />}
              Post Payment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
