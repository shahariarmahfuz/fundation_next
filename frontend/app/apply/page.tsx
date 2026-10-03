"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { api } from "@/lib/api";
import { UserPlus, CheckCircle2, AlertCircle, ArrowLeft, Loader2 } from "lucide-react";

interface GroupOption {
  id: number;
  name: string;
  code: string;
}

export default function MemberApplicationPage() {
  const [fullName, setFullName] = useState("");
  const [groupId, setGroupId] = useState("");
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    applicantName: string;
    groupName: string;
  } | null>(null);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const data = await api.get("/member-applications/groups");
        setGroups(data || []);
        if (data && data.length > 0) {
          setGroupId(String(data[0].id));
        }
      } catch (err: any) {
        setError("Unable to load groups. Please refresh or try again later.");
      } finally {
        setLoadingGroups(false);
      }
    };
    fetchGroups();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!groupId) {
      setError("Please select a group.");
      return;
    }

    setLoading(true);
    setError(null);

    const selectedGroup = groups.find((g) => String(g.id) === String(groupId));

    try {
      await api.post("/member-applications", {
        full_name: fullName.trim(),
        group_id: parseInt(groupId),
      });

      setSuccessData({
        applicantName: fullName.trim(),
        groupName: selectedGroup?.name || "Selected Group",
      });
    } catch (err: any) {
      setError(err.message || "Failed to submit membership application.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-12 sm:py-16">
        <div className="w-full max-w-lg px-4 sm:px-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foundation-50 text-foundation-700 dark:bg-foundation-950/60 dark:text-foundation-400 border border-foundation-100 dark:border-foundation-900">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Membership Application
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Apply to join our foundation.
                </p>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-6 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
                <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Success State */}
            {successData ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-6 sm:p-8 text-center space-y-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                <CheckCircle2 className="h-12 w-12 text-emerald-600 dark:text-emerald-400 mx-auto" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Application Submitted
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  Thank you, <strong>{successData.applicantName}</strong>. Your application to join{" "}
                  <strong>{successData.groupName}</strong> has been received and is pending administrator review.
                </p>
                <div className="pt-2">
                  <Link href="/" className="btn-primary inline-flex items-center gap-2 text-xs">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to Home
                  </Link>
                </div>
              </div>
            ) : (
              /* Public Form: Only Full Name and Group */
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name * */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    className="input-field text-sm"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                {/* Group * */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Group <span className="text-rose-500">*</span>
                  </label>
                  {loadingGroups ? (
                    <div className="flex items-center gap-2 p-2.5 text-xs text-slate-400">
                      <Loader2 className="h-4 w-4 animate-spin text-foundation-700" />
                      Loading groups...
                    </div>
                  ) : (
                    <select
                      required
                      className="input-field text-sm font-medium"
                      value={groupId}
                      onChange={(e) => setGroupId(e.target.value)}
                    >
                      {groups.length === 0 && (
                        <option value="">No active groups available</option>
                      )}
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || loadingGroups || !fullName.trim() || !groupId}
                    className="w-full btn-primary flex items-center justify-center gap-2 py-2.5 text-sm font-bold shadow-md shadow-foundation-700/20 disabled:opacity-50"
                  >
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
