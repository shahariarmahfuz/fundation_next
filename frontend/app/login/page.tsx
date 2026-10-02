"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, setAuthToken, setStoredUser } from "@/lib/api";
import { ShieldCheck, Lock, User, AlertCircle, Loader2, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username_or_email: "admin",
    password: "AdminPassword123!",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post("/auth/login", formData);
      setAuthToken(res.access_token);
      setStoredUser(res.user);
      router.push("/admin/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid login credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.15),transparent_50%)]"></div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 text-xs text-foundation-400 hover:text-foundation-300 mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Public Website
          </Link>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-foundation-600 text-white mx-auto shadow-lg shadow-foundation-900/50">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Management Portal</h2>
          <p className="text-xs text-slate-400">
            Secure authentication for foundation administrators, accountants & staff
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-8 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-5 flex items-center gap-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Username or Email
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  required
                  type="text"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:border-foundation-500 focus:outline-none focus:ring-1 focus:ring-foundation-500"
                  placeholder="admin or email"
                  value={formData.username_or_email}
                  onChange={(e) => setFormData({ ...formData, username_or_email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  required
                  type="password"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:border-foundation-500 focus:outline-none focus:ring-1 focus:ring-foundation-500"
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full btn-primary !bg-foundation-600 hover:!bg-foundation-500 !text-slate-950 font-bold py-2.5"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign In to Management
            </button>
          </form>

          {/* Quick test credentials hint */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            <p className="text-[11px] text-slate-400">
              Default Super Admin credentials:
            </p>
            <div className="mt-2 inline-flex items-center gap-2 rounded bg-slate-900 px-3 py-1 text-xs text-foundation-400 font-mono border border-slate-800">
              <span>admin</span> / <span>AdminPassword123!</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
