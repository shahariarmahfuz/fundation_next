"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import { Pagination } from "@/components/Pagination";
import { Modal } from "@/components/Modal";
import {
  Scale,
  Plus,
  Coins,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FolderTree,
  User,
  ArrowRight
} from "lucide-react";

export default function QardHasanPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Disburse Modal
  const [disburseModalOpen, setDisburseModalOpen] = useState(false);
  const [disburseForm, setDisburseForm] = useState({
    group_id: "",
    beneficiary_id: "",
    principal_amount: "10000.00",
    monthly_repayment_amount: "1000.00",
    disbursed_date: new Date().toISOString().split("T")[0],
    repayment_schedule_notes: "10 installments of ৳1,000",
    notes: "",
  });
  const [disbursing, setDisbursing] = useState(false);
  const [disburseError, setDisburseError] = useState<string | null>(null);

  // Repayment Modal
  const [repayModalOpen, setRepayModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any | null>(null);
  const [repayAmount, setRepayAmount] = useState("");
  const [repayMethod, setRepayMethod] = useState("CASH");
  const [repayRef, setRepayRef] = useState("");
  const [repayDate, setRepayDate] = useState(new Date().toISOString().split("T")[0]);
  const [repaying, setRepaying] = useState(false);
  const [repayError, setRepayError] = useState<string | null>(null);

  const fetchDropdowns = async () => {
    try {
      const [g, b] = await Promise.all([
        api.get("/groups"),
        api.get("/beneficiaries?page=1&page_size=100"),
      ]);
      setGroups(g);
      setBeneficiaries(b.items);
      if (g.length > 0) setDisburseForm((prev) => ({ ...prev, group_id: String(g[0].id) }));
      if (b.items.length > 0) setDisburseForm((prev) => ({ ...prev, beneficiary_id: String(b.items[0].id) }));
    } catch {}
  };

  const fetchLoans = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });
      if (selectedStatus) params.append("status", selectedStatus);

      const res = await api.get(`/qard-hasan?${params.toString()}`);
      setLoans(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err: any) {
      setError(err.message || "Failed to load Qard Hasan records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchLoans();
  }, [page, pageSize, selectedStatus]);

  const handleDisburseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisbursing(true);
    setDisburseError(null);
    try {
      await api.post("/qard-hasan", {
        ...disburseForm,
        group_id: parseInt(disburseForm.group_id),
        beneficiary_id: parseInt(disburseForm.beneficiary_id),
        principal_amount: parseFloat(disburseForm.principal_amount),
        monthly_repayment_amount: parseFloat(disburseForm.monthly_repayment_amount),
      });
      setDisburseModalOpen(false);
      fetchLoans();
    } catch (err: any) {
      setDisburseError(err.message || "Failed to disburse Qard Hasan");
    } finally {
      setDisbursing(false);
    }
  };

  const handleRepaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;
    setRepaying(true);
    setRepayError(null);
    try {
      await api.post("/qard-hasan/repayments", {
        qard_hasan_id: selectedLoan.id,
        amount: parseFloat(repayAmount),
        repayment_date: repayDate,
        payment_method: repayMethod,
        reference: repayRef,
      });
      setRepayModalOpen(false);
      fetchLoans();
    } catch (err: any) {
      setRepayError(err.message || "Failed to record repayment");
    } finally {
      setRepaying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Qard Hasan (Interest-Free Loans)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Shariah-compliant interest-free financing (0% Interest) with revolving group returns
          </p>
        </div>
        <button onClick={() => setDisburseModalOpen(true)} className="btn-primary">
          <Plus className="h-4 w-4" />
          Disburse Qard Hasan
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 p-4 text-xs sm:text-sm text-rose-800 dark:text-rose-300">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Filter Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="input-field py-1 text-xs w-48"
          >
            <option value="">All Loans</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="DEFAULTED">DEFAULTED</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
          Interest Rate: <strong className="text-emerald-700 dark:text-emerald-400 font-bold">Strictly 0%</strong> (No fees or usury)
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table-custom">
          <thead>
            <tr>
              <th>Loan Number</th>
              <th>Beneficiary</th>
              <th>Source Group</th>
              <th className="text-right">Principal</th>
              <th className="text-right">Monthly Rate</th>
              <th className="text-right">Total Repaid</th>
              <th className="text-right">Outstanding</th>
              <th>Status</th>
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
            ) : loans.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-slate-400">
                  No Qard Hasan loan records found.
                </td>
              </tr>
            ) : (
              loans.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">{l.qard_number}</td>
                  <td>
                    <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">{l.beneficiary?.name}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-400">{l.beneficiary?.phone}</div>
                  </td>
                  <td>
                    <span className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                      <FolderTree className="h-3 w-3 text-foundation-700 dark:text-emerald-400" />
                      {l.group?.name}
                    </span>
                  </td>
                  <td className="text-right font-bold text-xs text-slate-900 dark:text-slate-100">
                    {formatCurrency(l.principal_amount)}
                  </td>
                  <td className="text-right text-xs text-slate-600 dark:text-slate-400">
                    {formatCurrency(l.monthly_repayment_amount)}/mo
                  </td>
                  <td className="text-right font-semibold text-xs text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(l.total_repaid)}
                  </td>
                  <td className="text-right font-bold text-xs text-blue-700 dark:text-blue-400">
                    {formatCurrency(l.outstanding_amount)}
                  </td>
                  <td>
                    <StatusBadge status={l.status} />
                  </td>
                  <td className="text-right">
                    {l.status === "ACTIVE" ? (
                      <button
                        onClick={() => {
                          setSelectedLoan(l);
                          setRepayAmount(String(l.monthly_repayment_amount));
                          setRepayModalOpen(true);
                        }}
                        className="btn-primary !py-1 !px-2.5 text-xs"
                      >
                        Receive Repay
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-end gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Settled
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

      {/* Modal: Disburse Qard Hasan */}
      <Modal
        isOpen={disburseModalOpen}
        onClose={() => setDisburseModalOpen(false)}
        title="Disburse Interest-Free Qard Hasan Loan"
      >
        <form onSubmit={handleDisburseSubmit} className="space-y-4">
          {disburseError && (
            <div className="rounded-lg bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              {disburseError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Beneficiary (Recipient) <span className="text-rose-500">*</span>
            </label>
            <select
              required
              className="input-field"
              value={disburseForm.beneficiary_id}
              onChange={(e) => setDisburseForm({ ...disburseForm, beneficiary_id: e.target.value })}
            >
              {beneficiaries.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.phone}) — {b.beneficiary_number}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Source Accounting Group <span className="text-rose-500">*</span>
            </label>
            <select
              required
              className="input-field font-semibold"
              value={disburseForm.group_id}
              onChange={(e) => setDisburseForm({ ...disburseForm, group_id: e.target.value })}
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} (Balance: {formatCurrency(g.current_balance)})
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-400">
              Capital will be disbursed from this group. Repayments will return to this group.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Principal Amount (৳) <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="number"
                step="500"
                className="input-field"
                value={disburseForm.principal_amount}
                onChange={(e) => setDisburseForm({ ...disburseForm, principal_amount: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Monthly Repayment (৳) <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="number"
                step="100"
                className="input-field"
                value={disburseForm.monthly_repayment_amount}
                onChange={(e) => setDisburseForm({ ...disburseForm, monthly_repayment_amount: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Disbursement Date</label>
            <input
              required
              type="date"
              className="input-field"
              value={disburseForm.disbursed_date}
              onChange={(e) => setDisburseForm({ ...disburseForm, disbursed_date: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Repayment Schedule / Notes
            </label>
            <textarea
              rows={2}
              className="input-field"
              value={disburseForm.repayment_schedule_notes}
              onChange={(e) => setDisburseForm({ ...disburseForm, repayment_schedule_notes: e.target.value })}
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button type="button" onClick={() => setDisburseModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={disbursing} className="btn-primary">
              {disbursing && <Loader2 className="h-4 w-4 animate-spin" />}
              Disburse Qard Hasan
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Record Repayment */}
      <Modal
        isOpen={repayModalOpen}
        onClose={() => setRepayModalOpen(false)}
        title={`Record Qard Repayment — ${selectedLoan?.beneficiary?.name}`}
      >
        <form onSubmit={handleRepaymentSubmit} className="space-y-4">
          {repayError && (
            <div className="rounded-lg bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              {repayError}
            </div>
          )}

          <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs space-y-1 text-slate-800 dark:text-slate-200">
            <div><strong>Loan:</strong> {selectedLoan?.qard_number}</div>
            <div><strong>Beneficiary:</strong> {selectedLoan?.beneficiary?.name}</div>
            <div><strong>Credited Group:</strong> {selectedLoan?.group?.name}</div>
            <div><strong>Remaining Outstanding:</strong> {formatCurrency(selectedLoan?.outstanding_amount)}</div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Repayment Amount (৳ BDT) <span className="text-rose-500">*</span>
            </label>
            <input
              required
              type="number"
              step="50"
              max={selectedLoan?.outstanding_amount}
              className="input-field"
              value={repayAmount}
              onChange={(e) => setRepayAmount(e.target.value)}
            />
            <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-400">
              Cannot exceed remaining principal (৳{selectedLoan?.outstanding_amount}).
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Payment Method</label>
            <select
              className="input-field"
              value={repayMethod}
              onChange={(e) => setRepayMethod(e.target.value)}
            >
              <option value="CASH">CASH</option>
              <option value="BKASH">BKASH</option>
              <option value="NAGAD">NAGAD</option>
              <option value="BANK_TRANSFER">BANK TRANSFER</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Reference</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. REP-REC-001"
              value={repayRef}
              onChange={(e) => setRepayRef(e.target.value)}
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button type="button" onClick={() => setRepayModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={repaying} className="btn-primary">
              {repaying && <Loader2 className="h-4 w-4 animate-spin" />}
              Post Repayment & Return Funds
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
