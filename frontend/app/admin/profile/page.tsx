"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  User as UserIcon,
  Mail,
  Shield,
  Key,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  ShieldCheck,
  ArrowLeft,
  Lock,
  Calendar,
  Check,
  Save,
  RotateCcw
} from "lucide-react";
import { api, getStoredUser, setStoredUser } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

export default function UserProfilePage() {
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
  });

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/auth/me");
      setProfile(res);
      setFormData({
        full_name: res.full_name || "",
        email: res.email || "",
        password: "",
        confirm_password: "",
      });
      // Synchronize client storage
      setStoredUser(res);
    } catch (err: any) {
      setError(err.message || "Failed to load profile details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleReset = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        email: profile.email || "",
        password: "",
        confirm_password: "",
      });
    }
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate passwords if provided
    if (formData.password || formData.confirm_password) {
      if (!formData.password) {
        setError("Please enter a new password");
        return;
      }
      if (formData.password !== formData.confirm_password) {
        setError("New password and confirm password do not match");
        return;
      }
      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters long");
        return;
      }
    }

    setSaving(true);
    try {
      const payload: any = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
      };
      if (formData.password) {
        payload.password = formData.password;
      }

      const res = await api.put("/auth/me", payload);
      setProfile(res);
      setStoredUser(res);
      // Dispatch event for other components (like header) to immediately refresh user state
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("user-profile-updated"));
      }
      setSuccess("Profile updated successfully! Your account information has been saved.");
      setFormData((prev) => ({ ...prev, password: "", confirm_password: "" }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setError(err.message || "Failed to update profile. Please correct the issue and try again.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  };

  const userAvatarInitial = profile?.full_name
    ? profile.full_name.charAt(0).toUpperCase()
    : profile?.username
    ? profile.username.charAt(0).toUpperCase()
    : "A";

  const roleName = profile?.role?.name || (profile?.is_superuser ? "Super Admin" : "Staff");

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Loading your profile...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/dashboard"
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            title="Return to Dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              User Profile & Account
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage your personal account credentials, contact information, and security settings.
            </p>
          </div>
        </div>

        <Link
          href="/admin/dashboard"
          className="self-start sm:self-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors shadow-sm"
        >
          Back to Dashboard
        </Link>
      </div>

      {/* Success Banner */}
      {success && (
        <div className="flex items-start gap-3.5 rounded-2xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-800 p-4 sm:p-5 text-emerald-800 dark:text-emerald-200 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
              Profile updated successfully
            </h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
              Your account information has been saved.
            </p>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="flex items-start gap-3.5 rounded-2xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-800 p-4 sm:p-5 text-rose-800 dark:text-rose-200 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-rose-900 dark:text-rose-100">
              Unable to update profile
            </h3>
            <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* User Dossier Summary Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-2xl font-bold text-white shadow-md shadow-emerald-600/20">
              {userAvatarInitial}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate">
                  {profile?.full_name || profile?.username}
                </h2>
                {profile?.is_superuser && (
                  <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Superuser
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                @{profile?.username} • {profile?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
            <div className="text-left sm:text-right">
              <span className="text-[11px] font-medium text-slate-400 block">Assigned Role</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {roleName}
              </span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Profile Information */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Profile Information
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Update your display name and registered email address.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Foundation Super Administrator"
                  className="input-field pl-10"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Your full name as displayed throughout the application.
              </p>
            </div>

            {/* Username (Read-only) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Username</span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Read-only
                </span>
              </label>
              <input
                type="text"
                disabled
                className="input-field bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 cursor-not-allowed font-mono"
                value={`@${profile?.username || ""}`}
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Username cannot be changed after account creation.
              </p>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="admin@foundation.org"
                  className="input-field pl-10"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Used for notifications, account recovery, and sign in.
              </p>
            </div>

            {/* Role (Read-only) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Role</span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Lock className="h-3 w-3" /> System Assigned
                </span>
              </label>
              <div className="flex items-center gap-2 h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>{roleName}</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Roles are managed through the User Management module.
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Account Information */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Account Information
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              System access privileges and authentication activity.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40 p-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[11px] font-medium">Role Module</span>
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {roleName}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                {profile?.role?.description || (profile?.is_superuser ? "Complete system privileges" : "Standard staff privileges")}
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40 p-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[11px] font-medium">Last Login</span>
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {profile?.last_login ? formatDateTime(profile.last_login) : "Current Session"}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Most recent authenticated session
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40 p-4 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[11px] font-medium">Account Status</span>
              </div>
              <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Active Account
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Full access enabled
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Change Password */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Key className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Change Password
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Leave blank if you do not wish to change your current password.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Key className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  placeholder="Leave blank to keep existing"
                  className="input-field pl-10"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Minimum 6 characters with mixed characters recommended.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Key className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  className="input-field pl-10"
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Must match the new password entered above.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
