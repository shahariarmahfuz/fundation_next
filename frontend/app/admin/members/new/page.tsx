"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { UserPlus, ArrowLeft, Loader2, AlertCircle } from "lucide-react";

export default function NewMemberPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    address: "",
    nid_or_id: "",
    joining_date: new Date().toISOString().split("T")[0],
    status: "ACTIVE",
    monthly_contribution_amount: "500.00",
    group_id: "",
    notes: "",
  });

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const data = await api.get("/groups");
        setGroups(data);
        if (data.length > 0) {
          setFormData((prev) => ({ ...prev, group_id: String(data[0].id) }));
        }
      } catch (err: any) {
        setError(err.message || "Failed to load groups");
      }
    };
    fetchGroups();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.group_id) {
      setError("Please select a financial Group. Every member MUST belong to a Group.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/members", {
        ...formData,
        group_id: parseInt(formData.group_id),
        monthly_contribution_amount: parseFloat(formData.monthly_contribution_amount) || 500,
      });
      router.push(`/admin/members/${res.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create member");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/members"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Register New Member</h1>
          <p className="text-xs text-slate-500">
            A member cannot exist without an assigned accounting group
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-800">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="text"
                className="input-field"
                placeholder="e.g. Mohammad Rahim Uddin"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="tel"
                className="input-field"
                placeholder="e.g. +880 1711-000000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="e.g. member@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assigned Accounting Group <span className="text-rose-500">*</span>
              </label>
              <select
                required
                className="input-field font-semibold"
                value={formData.group_id}
                onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.code})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-slate-400">
                Monthly contributions will credit this group directly.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Monthly Contribution (৳ BDT) <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="number"
                step="50"
                min="100"
                className="input-field"
                value={formData.monthly_contribution_amount}
                onChange={(e) => setFormData({ ...formData, monthly_contribution_amount: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Joining Date <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="date"
                className="input-field"
                value={formData.joining_date}
                onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                NID or Identification Number
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="National ID or passport"
                value={formData.nid_or_id}
                onChange={(e) => setFormData({ ...formData, nid_or_id: e.target.value })}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
              <input
                type="text"
                className="input-field"
                placeholder="Residential address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
              <textarea
                rows={2}
                className="input-field"
                placeholder="Additional member remarks or references..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Link href="/admin/members" className="btn-secondary">
              Cancel
            </Link>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
