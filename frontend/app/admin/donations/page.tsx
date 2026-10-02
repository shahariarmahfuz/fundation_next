"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Pagination } from "@/components/Pagination";
import { Modal } from "@/components/Modal";
import {
  Gift,
  Plus,
  FolderTree,
  User,
  AlertCircle,
  Loader2,
  HeartHandshake
} from "lucide-react";

export default function DonationsPage() {
  const [donations, setDonations] = useState<any[]>([]);
  const [donors, setDonors] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Donation Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    donor_id: "",
    group_id: "",
    amount: "5000.00",
    donation_date: new Date().toISOString().split("T")[0],
    payment_method: "BANK_TRANSFER",
    reference: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // New Donor Modal
  const [donorModalOpen, setDonorModalOpen] = useState(false);
  const [newDonor, setNewDonor] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [savingDonor, setSavingDonor] = useState(false);

  const fetchDropdowns = async () => {
    try {
      const [g, d] = await Promise.all([
        api.get("/groups"),
        api.get("/donors?page=1&page_size=100"),
      ]);
      setGroups(g);
      setDonors(d.items);
      if (g.length > 0) setFormData((prev) => ({ ...prev, group_id: String(g[0].id) }));
    } catch {}
  };

  const fetchDonations = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });
      if (selectedGroup) params.append("group_id", selectedGroup);

      const res = await api.get(`/donations?${params.toString()}`);
      setDonations(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err: any) {
      setError(err.message || "Failed to load donations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchDonations();
  }, [page, pageSize, selectedGroup]);

  const handleDonationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.post("/donations", {
        ...formData,
        donor_id: formData.donor_id ? parseInt(formData.donor_id) : null,
        group_id: parseInt(formData.group_id),
        amount: parseFloat(formData.amount),
      });
      setModalOpen(false);
      fetchDonations();
    } catch (err: any) {
      setSubmitError(err.message || "Failed to record donation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDonor(true);
    try {
      const res = await api.post("/donors", newDonor);
      setDonorModalOpen(false);
      setNewDonor({ name: "", phone: "", email: "", address: "" });
      await fetchDropdowns();
      setFormData((prev) => ({ ...prev, donor_id: String(res.id) }));
    } catch (err: any) {
      alert(err.message || "Failed to add donor");
    } finally {
      setSavingDonor(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Donations & Donors</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Philanthropic donations credited directly to dedicated accounting groups
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setDonorModalOpen(true)} className="btn-secondary">
            <User className="h-4 w-4" />
            Add Donor
          </button>
          <button onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus className="h-4 w-4" />
            Record Donation
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-800">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-700">Filter Group:</span>
          <select
            value={selectedGroup}
            onChange={(e) => {
              setSelectedGroup(e.target.value);
              setPage(1);
            }}
            className="input-field py-1 text-xs w-64"
          >
            <option value="">All Accounting Groups</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table-custom">
          <thead>
            <tr>
              <th>Donation No.</th>
              <th>Date</th>
              <th>Donor</th>
              <th>Credited Group</th>
              <th>Payment Method</th>
              <th>Reference</th>
              <th className="text-right">Amount (৳)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-foundation-700" />
                </td>
              </tr>
            ) : donations.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400">
                  No donations recorded yet.
                </td>
              </tr>
            ) : (
              donations.map((d) => (
                <tr key={d.id}>
                  <td className="font-mono text-xs font-semibold text-slate-900">
                    {d.donation_number}
                  </td>
                  <td className="text-xs text-slate-500">{formatDate(d.donation_date)}</td>
                  <td>
                    <div className="font-semibold text-xs text-slate-900">
                      {d.donor?.name || "Anonymous Donor"}
                    </div>
                    {d.donor?.phone && (
                      <div className="text-[10px] text-slate-400">{d.donor.phone}</div>
                    )}
                  </td>
                  <td>
                    <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      <FolderTree className="h-3 w-3 text-foundation-700" />
                      {d.group?.name}
                    </span>
                  </td>
                  <td className="font-mono text-xs text-slate-600">{d.payment_method}</td>
                  <td className="font-mono text-xs text-slate-500">{d.reference || "-"}</td>
                  <td className="text-right font-bold text-xs text-emerald-700">
                    +{formatCurrency(d.amount)}
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

      {/* Modal: Record Donation */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Record Incoming Donation"
      >
        <form onSubmit={handleDonationSubmit} className="space-y-4">
          {submitError && (
            <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              {submitError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Donor (Optional / Anonymous)
            </label>
            <select
              className="input-field"
              value={formData.donor_id}
              onChange={(e) => setFormData({ ...formData, donor_id: e.target.value })}
            >
              <option value="">Anonymous Donor</option>
              {donors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.phone || "No phone"}) — {d.donor_number}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Credited Group Account <span className="text-rose-500">*</span>
            </label>
            <select
              required
              className="input-field font-semibold"
              value={formData.group_id}
              onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} (Current Balance: {formatCurrency(g.current_balance)})
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-slate-400">
              Money will be deposited into and increase this group&apos;s balance.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Donation Amount (৳ BDT) <span className="text-rose-500">*</span>
            </label>
            <input
              required
              type="number"
              step="100"
              className="input-field"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                className="input-field"
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              >
                <option value="BANK_TRANSFER">BANK TRANSFER</option>
                <option value="BKASH">BKASH</option>
                <option value="NAGAD">NAGAD</option>
                <option value="CASH">CASH</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
              <input
                required
                type="date"
                className="input-field"
                value={formData.donation_date}
                onChange={(e) => setFormData({ ...formData, donation_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reference / Bank Slip</label>
            <input
              type="text"
              placeholder="e.g. SLIP-102938"
              className="input-field"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Post Donation & Credit Group
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: New Donor */}
      <Modal
        isOpen={donorModalOpen}
        onClose={() => setDonorModalOpen(false)}
        title="Add Donor Profile"
      >
        <form onSubmit={handleCreateDonor} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Donor Name <span className="text-rose-500">*</span>
            </label>
            <input
              required
              type="text"
              className="input-field"
              placeholder="e.g. Haji Kabir Ahmed"
              value={newDonor.name}
              onChange={(e) => setNewDonor({ ...newDonor, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
            <input
              type="tel"
              className="input-field"
              placeholder="+880 1711-000000"
              value={newDonor.phone}
              onChange={(e) => setNewDonor({ ...newDonor, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
            <input
              type="email"
              className="input-field"
              placeholder="donor@example.com"
              value={newDonor.email}
              onChange={(e) => setNewDonor({ ...newDonor, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
            <input
              type="text"
              className="input-field"
              placeholder="City, District"
              value={newDonor.address}
              onChange={(e) => setNewDonor({ ...newDonor, address: e.target.value })}
            />
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button type="button" onClick={() => setDonorModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={savingDonor} className="btn-primary">
              {savingDonor && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Donor
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
