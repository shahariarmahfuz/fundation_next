"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { api } from "@/lib/api";
import { UserPlus, CheckCircle2, AlertCircle, ArrowLeft, Loader2 } from "lucide-react";

export default function MemberApplicationPage() {
  const [formData, setFormData] = useState({
    applicant_name: "",
    email: "",
    phone: "",
    address: "",
    nid_or_id: "",
    proposed_contribution: "500.00",
    reason_for_joining: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post("/member-applications", {
        ...formData,
        proposed_contribution: parseFloat(formData.proposed_contribution) || 500,
      });
      setSuccessData(res);
    } catch (err: any) {
      setError(err.message || "Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-10 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foundation-100 text-foundation-800">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Membership Application
                </h1>
                <p className="text-xs sm:text-sm text-slate-500">
                  Join Al-Birr Foundation to contribute regularly and support community welfare
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-6 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-800">
                <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {successData ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-8 text-center space-y-4">
                <CheckCircle2 className="h-14 w-14 text-emerald-600 mx-auto" />
                <h3 className="text-xl font-bold text-slate-900">Application Submitted Successfully!</h3>
                <p className="text-sm text-slate-700 max-w-lg mx-auto">
                  Thank you, <strong>{successData.applicant_name}</strong>. Your membership application (ID: #{successData.id})
                  has been submitted for review by the management board.
                </p>
                <div className="bg-white p-4 rounded-lg border border-emerald-200 text-xs text-slate-600 max-w-md mx-auto text-left space-y-1">
                  <div><strong>Status:</strong> PENDING MANAGEMENT REVIEW</div>
                  <div><strong>Proposed Monthly Contribution:</strong> ৳{successData.proposed_contribution}</div>
                  <div><strong>Next Step:</strong> Upon approval, an accounting group will be assigned to you and your membership ID generated.</div>
                </div>
                <div className="pt-4">
                  <Link href="/" className="btn-primary">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Home
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Legal Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      className="input-field"
                      placeholder="e.g. Mohammad Rahim Uddin"
                      value={formData.applicant_name}
                      onChange={(e) => setFormData({ ...formData, applicant_name: e.target.value })}
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      className="input-field"
                      placeholder="e.g. rahim@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      NID or National ID
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. 1990123456789"
                      value={formData.nid_or_id}
                      onChange={(e) => setFormData({ ...formData, nid_or_id: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Proposed Monthly Contribution (৳ BDT) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="number"
                      step="50"
                      min="100"
                      className="input-field"
                      placeholder="500"
                      value={formData.proposed_contribution}
                      onChange={(e) => setFormData({ ...formData, proposed_contribution: e.target.value })}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Residential Address
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="House / Road / Area / District"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Why do you wish to join Al-Birr Foundation?
                    </label>
                    <textarea
                      rows={3}
                      className="input-field"
                      placeholder="Share your motivation or area of philanthropic interest (Education, Medical, Qard Hasan, etc.)..."
                      value={formData.reason_for_joining}
                      onChange={(e) => setFormData({ ...formData, reason_for_joining: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                  <Link href="/" className="btn-secondary">
                    Cancel
                  </Link>
                  <button type="submit" disabled={loading} className="btn-primary">
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Submit Application
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
