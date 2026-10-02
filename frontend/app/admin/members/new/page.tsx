"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, Loader2, AlertCircle, Coins, Info } from "lucide-react";

export default function NewMemberPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<any[]>([]);
  const [foundationRate, setFoundationRate] = useState<number>(100);
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
    group_id: "",
    notes: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupsData, settingData] = await Promise.all([
          api.get("/groups"),
          api.get("/settings/monthly-contribution").catch(() => null),
        ]);
        setGroups(groupsData);
        if (groupsData.length > 0) {
          setFormData((prev) => ({ ...prev, group_id: String(groupsData[0].id) }));
        }
        if (settingData?.current_amount) {
          setFoundationRate(parseFloat(settingData.current_amount));
        }
      } catch (err: any) {
        setError(err.message || "Failed to load groups");
      }
    };
    fetchData();
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
      const payload: any = {
        full_name: formData.full_name,
        phone: formData.phone,
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
        nid_or_id: formData.nid_or_id.trim() || undefined,
        joining_date: formData.joining_date,
        status: formData.status,
        group_id: parseInt(formData.group_id),
        notes: formData.notes.trim() || undefined,
      };
      const res = await api.post("/members", payload);
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
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Register New Member</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            A member cannot exist without an assigned accounting group
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-800 p-4 text-xs sm:text-sm text-rose-800 dark:text-rose-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="e.g. member@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
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

            {/* Global Foundation Monthly Contribution Info Card (Not member-editable) */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 dark:border-emerald-800 dark:bg-emerald-950/30 p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                  <Coins className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Monthly Contribution
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">
                  Source: Foundation Setting
                </span>
              </div>
              <div className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                {formatCurrency(foundationRate)}
                <span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-1">/ month</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                All active foundation members follow the global monthly contribution setting. Managed under Settings.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                National ID / Passport / Reg No
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. NID 1988269123456"
                value={formData.nid_or_id}
                onChange={(e) => setFormData({ ...formData, nid_or_id: e.target.value })}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Permanent / Residential Address
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. House #14, Road #2, Dhanmondi, Dhaka"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Notes & Additional Remarks
              </label>
              <textarea
                rows={2}
                className="input-field"
                placeholder="Any special remarks regarding this member..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Link
              href="/admin/members"
              className="rounded-xl border border-slate-300 dark:border-slate-700 px-5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Registering Member...
                </>
              ) : (
                "Complete Registration"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
