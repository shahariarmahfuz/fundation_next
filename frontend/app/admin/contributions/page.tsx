"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getFoundationTodayDate, getFoundationCurrentMonth } from "@/lib/timezone";
import { StatusBadge } from "@/components/StatusBadge";
import { Pagination } from "@/components/Pagination";
import { Modal } from "@/components/Modal";
import { CustomSelect } from "@/components/ui/custom-select";
import {
  Coins,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Loader2,
  AlertCircle,
  FolderTree
} from "lucide-react";

export default function ContributionsPage() {
  const [contributions, setContributions] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pay Modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedContrib, setSelectedContrib] = useState<any | null>(null);
  const [payMethod, setPayMethod] = useState("CASH");
  const [payRef, setPayRef] = useState("");
  const [payDate, setPayDate] = useState(getFoundationTodayDate());
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  // Generate Month Modal
  const [genModalOpen, setGenModalOpen] = useState(false);
  const [genMonth, setGenMonth] = useState(getFoundationCurrentMonth());
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState<any | null>(null);

  const fetchDropdowns = async () => {
    try {
      const [g, m] = await Promise.all([
        api.get("/groups"),
        api.get("/members?page=1&page_size=100"),
      ]);
      setGroups(g);
      setMembers(m.items);
    } catch {}
  };

  const fetchContributions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });
      if (selectedGroup) params.append("group_id", selectedGroup);
      if (selectedStatus) params.append("status", selectedStatus);
      if (selectedMonth) params.append("contribution_month", selectedMonth);

      const res = await api.get(`/contributions?${params.toString()}`);
      setContributions(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err: any) {
      setError(err.message || "Failed to load contributions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchContributions();
  }, [page, pageSize, selectedGroup, selectedStatus, selectedMonth]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContrib) return;
    setPaying(true);
    setPayError(null);
    try {
      await api.post(`/contributions/${selectedContrib.id}/pay`, {
        payment_method: payMethod,
        reference: payRef,
        payment_date: payDate,
      });
      setPayModalOpen(false);
      fetchContributions();
    } catch (err: any) {
      setPayError(err.message || "Failed to process payment");
    } finally {
      setPaying(false);
    }
  };

  const handleGenerateMonth = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await api.post("/contributions/generate-month", {
        contribution_month: genMonth,
      });
      setGenResult(res);
      fetchContributions();
    } catch (err: any) {
      setError(err.message || "Failed to generate monthly contributions");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Monthly Contributions</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Track member monthly contribution payments and automatically credit their assigned group
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/contributions/receive"
            className="btn-primary"
          >
            <Plus className="h-4 w-4" />
            Receive Contribution
          </Link>
          <button
            onClick={() => {
              setGenResult(null);
              setGenModalOpen(true);
            }}
            className="btn-secondary"
          >
            <Calendar className="h-4 w-4" />
            Generate Monthly Dues
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-800">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Filter by Month</label>
            <input
              type="month"
              className="input-field py-1.5 text-xs"
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Filter by Group</label>
            <CustomSelect
              value={selectedGroup}
              onChange={(val) => {
                setSelectedGroup(String(val));
                setPage(1);
              }}
              options={[
                { value: "", label: "All Groups" },
                ...groups.map((g) => ({
                  value: String(g.id),
                  label: g.name,
                  sublabel: `(${g.code})`,
                })),
              ]}
              searchable={true}
              searchPlaceholder="Search groups..."
              triggerClassName="py-1.5 text-xs h-9"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Filter by Status</label>
            <CustomSelect
              value={selectedStatus}
              onChange={(val) => {
                setSelectedStatus(String(val));
                setPage(1);
              }}
              options={[
                { value: "", label: "All Statuses" },
                { value: "PAID", label: "PAID" },
                { value: "DUE", label: "DUE" },
                { value: "CURRENT_PENDING", label: "CURRENT PENDING" },
                { value: "FUTURE", label: "FUTURE" },
              ]}
              searchable={false}
              triggerClassName="py-1.5 text-xs h-9"
            />
          </div>
        </div>
      </div>

      {/* Contributions Table */}
      <div className="table-container">
        <table className="table-custom">
          <thead>
            <tr>
              <th>Receipt Number</th>
              <th>Month</th>
              <th>Member Name</th>
              <th>Credited Group</th>
              <th>Status</th>
              <th>Paid Date</th>
              <th>Payment Method</th>
              <th className="text-right">Amount (৳)</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-foundation-700" />
                </td>
              </tr>
            ) : contributions.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-slate-400">
                  No contributions found. Click &quot;Generate Monthly Dues&quot; to initialize monthly records.
                </td>
              </tr>
            ) : (
              contributions.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {c.contribution_number}
                  </td>
                  <td className="font-semibold text-xs text-slate-800 dark:text-slate-200">{c.contribution_month}</td>
                  <td>
                    <div className="font-medium text-xs text-slate-900 dark:text-slate-100">{c.member?.full_name}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-400">{c.member?.member_number}</div>
                  </td>
                  <td>
                    <span className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                      <FolderTree className="h-3 w-3 text-foundation-700 dark:text-emerald-400" />
                      {c.group?.name || `Group #${c.group_id}`}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="text-xs text-slate-500 dark:text-slate-400">{formatDate(c.payment_date)}</td>
                  <td className="text-xs text-slate-600 dark:text-slate-400 font-mono">{c.payment_method || "-"}</td>
                  <td className="text-right font-bold text-xs text-slate-900 dark:text-slate-100">
                    {formatCurrency(c.amount)}
                  </td>
                  <td className="text-right">
                    {c.status !== "PAID" ? (
                      <button
                        onClick={() => {
                          setSelectedContrib(c);
                          setPayModalOpen(true);
                        }}
                        className="btn-primary !py-1 !px-2.5 text-xs"
                      >
                        Receive Pay
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-end gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Credited
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
        onPageChange={(p) => setPage(p)}
        onPageSizeChange={(ps) => {
          setPageSize(ps);
          setPage(1);
        }}
      />

      {/* Modal: Process Payment */}
      <Modal
        isOpen={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        title={`Receive Payment — ${selectedContrib?.member?.full_name}`}
      >
        <form onSubmit={handlePay} className="space-y-4">
          {payError && (
            <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              {payError}
            </div>
          )}

          <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs space-y-1 text-slate-800 dark:text-slate-200">
            <div>
              <strong>Member:</strong> {selectedContrib?.member?.full_name} ({selectedContrib?.member?.member_number})
            </div>
            <div>
              <strong>Credited Group:</strong> {selectedContrib?.group?.name}
            </div>
            <div>
              <strong>Month:</strong> {selectedContrib?.contribution_month}
            </div>
            <div>
              <strong>Amount Due:</strong> {formatCurrency(selectedContrib?.amount)}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Payment Date</label>
            <input
              required
              type="date"
              className="input-field"
              value={payDate}
              onChange={(e) => setPayDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Payment Method</label>
            <CustomSelect
              value={payMethod}
              onChange={(val) => setPayMethod(String(val))}
              options={[
                { value: "CASH", label: "CASH" },
                { value: "BKASH", label: "BKASH" },
                { value: "NAGAD", label: "NAGAD" },
                { value: "BANK_TRANSFER", label: "BANK TRANSFER" },
                { value: "OTHER", label: "OTHER" },
              ]}
              searchable={false}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Transaction Reference / Note
            </label>
            <input
              type="text"
              placeholder="e.g. TRX-BKASH-77123"
              className="input-field"
              value={payRef}
              onChange={(e) => setPayRef(e.target.value)}
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setPayModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={paying} className="btn-primary">
              {paying && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm Payment & Credit Group
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Generate Monthly Dues */}
      <Modal
        isOpen={genModalOpen}
        onClose={() => setGenModalOpen(false)}
        title="Batch Generate Monthly Contribution Dues"
      >
        <form onSubmit={handleGenerateMonth} className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            This will scan all active members in the database and create a <strong>DUE</strong> contribution
            record for each member who does not yet have a record for the selected month.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Contribution Month (YYYY-MM)
            </label>
            <input
              required
              type="month"
              className="input-field"
              value={genMonth}
              onChange={(e) => setGenMonth(e.target.value)}
            />
          </div>

          {genResult && (
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Successfully generated <strong>{genResult.created_records}</strong> due records for month {genResult.month}.
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setGenModalOpen(false)}
              className="btn-secondary"
            >
              Close
            </button>
            <button type="submit" disabled={generating} className="btn-primary">
              {generating && <Loader2 className="h-4 w-4 animate-spin" />}
              Generate Records
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
