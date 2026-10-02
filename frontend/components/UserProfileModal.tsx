"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { api, setStoredUser } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import {
  User as UserIcon,
  Mail,
  Shield,
  Key,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  ShieldCheck
} from "lucide-react";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated?: (updatedUser: any) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onUserUpdated,
}) => {
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
  });

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccess(null);
      setLoading(true);
      api
        .get("/auth/me")
        .then((res) => {
          setProfile(res);
          setFormData({
            full_name: res.full_name || "",
            email: res.email || "",
            password: "",
            confirm_password: "",
          });
        })
        .catch((err) => {
          setError(err.message || "Failed to load profile details");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (formData.password && formData.password !== formData.confirm_password) {
      setError("Passwords do not match");
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        full_name: formData.full_name,
        email: formData.email,
      };
      if (formData.password) {
        payload.password = formData.password;
      }

      const res = await api.put("/auth/me", payload);
      setProfile(res);
      setStoredUser(res);
      if (onUserUpdated) onUserUpdated(res);
      setSuccess("Profile updated successfully!");
      setFormData((prev) => ({ ...prev, password: "", confirm_password: "" }));
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="User Profile & Account" maxWidth="md">
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* User Dossier Summary Card */}
          <div className="flex items-center gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xl font-bold text-white shadow-sm">
              {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : <UserIcon className="h-7 w-7" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">
                  {profile?.full_name || profile?.username}
                </h4>
                {profile?.is_superuser && (
                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-500 border border-amber-500/20">
                    Superuser
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">@{profile?.username}</p>
              <div className="mt-1 flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-700 dark:text-emerald-400 text-[11px]">
                  <ShieldCheck className="h-3 w-3" />
                  {profile?.role?.name || (profile?.is_superuser ? "Super Admin" : "Staff")}
                </span>
                <span className="text-[11px] text-slate-400">•</span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Active Account
                </span>
              </div>
            </div>
          </div>

          {/* Account Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 p-3">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Role Module</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {profile?.role?.name || "System Administrator"}
              </span>
            </div>
            <div className="rounded-lg border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 p-3">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">Last Login</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                {profile?.last_login ? formatDateTime(profile.last_login) : "Current Session"}
              </span>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="flex items-center gap-2.5 rounded-lg border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 p-3 text-xs text-rose-700 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20 p-3 text-xs text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Update Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  className="input-field pl-9"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  className="input-field pl-9"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                Change Password (Optional)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Leave blank to keep current"
                    className="input-field"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    className="input-field"
                    value={formData.confirm_password}
                    onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary text-xs"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </Modal>
  );
};
