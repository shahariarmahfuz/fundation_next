"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Settings,
  Building2,
  FileEdit,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Globe,
  Mail,
  Phone,
  MapPin,
  Eye,
  Coins,
  Calendar,
  History,
  Clock,
  Info,
  ShieldCheck
} from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"org" | "contribution" | "cms">("org");

  // Organization State
  const [orgData, setOrgData] = useState<any>({
    name: "",
    tagline: "",
    logo_url: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    currency_code: "BDT",
    currency_symbol: "৳",
  });
  const [orgLoading, setOrgLoading] = useState(true);
  const [orgSaving, setOrgSaving] = useState(false);
  const [orgSuccess, setOrgSuccess] = useState<string | null>(null);
  const [orgError, setOrgError] = useState<string | null>(null);

  // Monthly Contribution State
  const [mcOverview, setMcOverview] = useState<any | null>(null);
  const [mcLoading, setMcLoading] = useState(false);
  const [mcSaving, setMcSaving] = useState(false);
  const [mcSuccess, setMcSuccess] = useState<string | null>(null);
  const [mcError, setMcError] = useState<string | null>(null);
  const [mcFormData, setMcFormData] = useState({
    amount: "100.00",
    effective_from: new Date().toISOString().split("T")[0],
    notes: "",
  });

  // CMS State
  const [pages, setPages] = useState<any[]>([]);
  const [cmsLoading, setCmsLoading] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string>("home");
  const [currentPage, setCurrentPage] = useState<any | null>(null);
  const [pageSaving, setPageSaving] = useState(false);
  const [pageSuccess, setPageSuccess] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  // Fetch Organization Settings
  const fetchOrg = async () => {
    setOrgLoading(true);
    try {
      const data = await api.get("/organization");
      setOrgData(data);
    } catch (err: any) {
      setOrgError(err.message || "Failed to load organization settings");
    } finally {
      setOrgLoading(false);
    }
  };

  // Fetch Monthly Contribution Overview
  const fetchMonthlyContribution = async () => {
    setMcLoading(true);
    setMcError(null);
    try {
      const data = await api.get("/settings/monthly-contribution");
      setMcOverview(data);
      if (data.current_amount) {
        setMcFormData((prev) => ({
          ...prev,
          amount: String(data.current_amount),
        }));
      }
    } catch (err: any) {
      setMcError(err.message || "Failed to load monthly contribution settings");
    } finally {
      setMcLoading(false);
    }
  };

  // Fetch CMS Pages
  const fetchPages = async () => {
    setCmsLoading(true);
    try {
      const data = await api.get("/public/pages");
      setPages(data);
      if (data.length > 0) {
        setSelectedSlug(data[0].slug);
        setCurrentPage(data[0]);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setCmsLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "contribution") {
        setActiveTab("contribution");
      } else if (tabParam === "cms") {
        setActiveTab("cms");
      }
    }
    fetchOrg();
    fetchMonthlyContribution();
    fetchPages();
  }, []);

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrgSaving(true);
    setOrgError(null);
    try {
      const updated = await api.put("/organization", orgData);
      setOrgData(updated);
      setOrgSuccess("Organization settings saved successfully!");
      setTimeout(() => setOrgSuccess(null), 4000);
    } catch (err: any) {
      setOrgError(err.message || "Failed to save organization settings");
    } finally {
      setOrgSaving(false);
    }
  };

  const handleSaveMonthlyContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    setMcSaving(true);
    setMcError(null);
    setMcSuccess(null);
    try {
      const payload = {
        amount: parseFloat(mcFormData.amount),
        effective_from: mcFormData.effective_from,
        notes: mcFormData.notes.trim() || undefined,
      };
      const updated = await api.post("/settings/monthly-contribution", payload);
      setMcOverview(updated);
      setMcSuccess("Foundation Monthly Contribution setting saved successfully!");
      setMcFormData((prev) => ({ ...prev, notes: "" }));
      setTimeout(() => setMcSuccess(null), 5000);
    } catch (err: any) {
      setMcError(err.message || "Failed to update monthly contribution setting");
    } finally {
      setMcSaving(false);
    }
  };

  const handleSelectPage = async (slug: string) => {
    setSelectedSlug(slug);
    setPageSuccess(null);
    setPageError(null);
    try {
      const p = await api.get(`/public/pages/${slug}`);
      setCurrentPage(p);
    } catch (err: any) {
      setPageError(err.message || "Failed to load page content");
    }
  };

  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPage) return;
    setPageSaving(true);
    setPageError(null);
    try {
      const updated = await api.put(`/public/pages/${selectedSlug}`, {
        title: currentPage.title,
        subtitle: currentPage.subtitle,
        content: currentPage.content,
        banner_image_url: currentPage.banner_image_url,
        is_published: currentPage.is_published,
        meta_title: currentPage.meta_title,
        meta_description: currentPage.meta_description,
      });
      setCurrentPage(updated);
      setPageSuccess(`Page "${updated.title}" updated successfully!`);
      setTimeout(() => setPageSuccess(null), 4000);
      const listData = await api.get("/public/pages");
      setPages(listData);
    } catch (err: any) {
      setPageError(err.message || "Failed to save page");
    } finally {
      setPageSaving(false);
    }
  };

  const getPublicPath = (slug: string) => {
    if (slug === "home") return "/";
    return `/${slug}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Settings & Foundation Configuration
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Configure organization profile, global monthly contribution rate, currency defaults, and public website pages
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("org")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "org"
              ? "bg-slate-900 text-white dark:bg-emerald-600"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
          }`}
        >
          <Building2 className="h-4 w-4" />
          Foundation Profile & Details
        </button>

        <button
          onClick={() => setActiveTab("contribution")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "contribution"
              ? "bg-slate-900 text-white dark:bg-emerald-600"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
          }`}
        >
          <Coins className="h-4 w-4" />
          Monthly Contribution
        </button>

        <button
          onClick={() => setActiveTab("cms")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "cms"
              ? "bg-slate-900 text-white dark:bg-emerald-600"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
          }`}
        >
          <FileEdit className="h-4 w-4" />
          Public Website CMS Pages
        </button>
      </div>

      {/* TAB 1: ORGANIZATION PROFILE */}
      {activeTab === "org" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm max-w-4xl dark:border-slate-800 dark:bg-slate-900">
          {orgLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600 dark:text-emerald-400" />
              <span className="ml-3 text-slate-600 dark:text-slate-300 font-medium">Loading organization profile...</span>
            </div>
          ) : (
            <form onSubmit={handleSaveOrg} className="space-y-6">
              {orgSuccess && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200">
                  <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <span>{orgSuccess}</span>
                </div>
              )}

              {orgError && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200">
                  <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />
                  <span>{orgError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Organization Official Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={orgData.name || ""}
                    onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Tagline / Motto
                  </label>
                  <input
                    type="text"
                    value={orgData.tagline || ""}
                    onChange={(e) => setOrgData({ ...orgData, tagline: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Foundation Overview / Mission Summary
                </label>
                <textarea
                  rows={3}
                  value={orgData.description || ""}
                  onChange={(e) => setOrgData({ ...orgData, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    value={orgData.email || ""}
                    onChange={(e) => setOrgData({ ...orgData, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Official Contact Phone
                  </label>
                  <input
                    type="text"
                    value={orgData.phone || ""}
                    onChange={(e) => setOrgData({ ...orgData, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={orgData.website || ""}
                    onChange={(e) => setOrgData({ ...orgData, website: e.target.value })}
                    placeholder="https://example.org"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Headquarters Physical Address
                </label>
                <input
                  type="text"
                  value={orgData.address || ""}
                  onChange={(e) => setOrgData({ ...orgData, address: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Currency Symbol
                  </label>
                  <input
                    type="text"
                    value={orgData.currency_symbol || "৳"}
                    onChange={(e) => setOrgData({ ...orgData, currency_symbol: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Currency Code
                  </label>
                  <input
                    type="text"
                    value={orgData.currency_code || "BDT"}
                    onChange={(e) => setOrgData({ ...orgData, currency_code: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={orgSaving}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 shadow-sm disabled:opacity-50"
                >
                  {orgSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Organization Settings
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* TAB 2: MONTHLY CONTRIBUTION SETTINGS */}
      {activeTab === "contribution" && (
        <div className="space-y-6 max-w-5xl">
          {/* Active Banner & Quick Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-950/30 dark:to-slate-900 dark:border-emerald-800/60 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <Coins className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    Global Monthly Contribution Setting
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 px-3 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    Active Rate
                  </span>
                </div>

                <div className="mt-4">
                  <div className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {formatCurrency(mcOverview?.current_amount || 100)}
                    <span className="text-lg font-medium text-slate-500 dark:text-slate-400 ml-1.5">/ month</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                    Source: <strong className="font-semibold text-slate-800 dark:text-slate-100">Foundation Global Setting</strong>.
                    Every active member contributes this exact rate. It is not member-specific and cannot be modified per member.
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-emerald-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Effective Date: <strong>{formatDate(mcOverview?.effective_date)}</strong></span>
                {mcOverview?.active_setting?.notes && (
                  <span className="truncate max-w-xs text-right italic">&ldquo;{mcOverview.active_setting.notes}&rdquo;</span>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-amber-500" />
                  Scheduled Future Changes
                </span>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {mcOverview?.scheduled_settings?.length || 0}
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {mcOverview?.scheduled_settings && mcOverview.scheduled_settings.length > 0
                      ? `Next: ${formatCurrency(mcOverview.scheduled_settings[0].amount)}/mo effective from ${formatDate(mcOverview.scheduled_settings[0].effective_from)}`
                      : "No pending future rate revisions scheduled"}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                Future rate changes automatically take effect on their scheduled date without mutating historical months.
              </div>
            </div>
          </div>

          {/* Form: Change / Schedule Monthly Contribution */}
          <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 shadow-sm">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Coins className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  Change or Schedule Monthly Contribution Rate
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Update the Foundation-wide monthly contribution rate. Future dates will be scheduled automatically.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800">
                Requires settings.manage
              </span>
            </div>

            {mcSuccess && (
              <div className="mb-5 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200">
                <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <span>{mcSuccess}</span>
              </div>
            )}

            {mcError && (
              <div className="mb-5 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200">
                <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />
                <span>{mcError}</span>
              </div>
            )}

            <form onSubmit={handleSaveMonthlyContribution} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Monthly Contribution Rate (৳ BDT) *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-semibold">
                      ৳
                    </span>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      required
                      value={mcFormData.amount}
                      onChange={(e) => setMcFormData({ ...mcFormData, amount: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 pl-8 pr-3 py-2 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none font-semibold"
                      placeholder="100.00"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Standard initial default: ৳100 / month.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Effective From Date *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Calendar className="h-4 w-4" />
                    </span>
                    <input
                      type="date"
                      required
                      value={mcFormData.effective_from}
                      onChange={(e) => setMcFormData({ ...mcFormData, effective_from: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none font-mono"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Select today for immediate effect, or a future date to schedule advance rate change.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Resolution Notes / Purpose (Optional)
                </label>
                <input
                  type="text"
                  value={mcFormData.notes}
                  onChange={(e) => setMcFormData({ ...mcFormData, notes: e.target.value })}
                  placeholder="e.g., Executive Committee resolution #14, annual standard rate review"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 p-3.5 flex items-start gap-3 text-xs text-slate-600 dark:text-slate-300">
                <Info className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Strict Financial Accounting Rule:</strong> Modifying the rate will only apply to contribution months from the chosen effective date onward. All historical contribution payments, member ledgers, and past due amounts remain strictly unchanged.
                </span>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={mcSaving}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 shadow-sm disabled:opacity-50 transition-colors"
                >
                  {mcSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save / Schedule Rate
                </button>
              </div>
            </form>
          </div>

          {/* Table: Setting History & Scheduled Changes */}
          <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <History className="h-4 w-4 text-slate-500" />
                  Monthly Contribution History & Scheduled Rates
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Complete audit log of past, active, and upcoming Foundation contribution rate configurations.
                </p>
              </div>
              <button
                onClick={fetchMonthlyContribution}
                className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 underline"
              >
                Refresh
              </button>
            </div>

            {mcLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                <span className="ml-2 text-xs text-slate-500">Loading history...</span>
              </div>
            ) : mcOverview?.history && mcOverview.history.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="py-3 px-4">Effective Date</th>
                      <th className="py-3 px-4">Monthly Rate</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Resolution Notes / Reason</th>
                      <th className="py-3 px-4">Recorded By / Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {mcOverview.history.map((item: any) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono font-semibold text-xs text-slate-900 dark:text-white">
                          {formatDate(item.effective_from)}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                          {formatCurrency(item.amount)}
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-normal ml-1">/ month</span>
                        </td>
                        <td className="py-3 px-4">
                          {item.status === "ACTIVE" && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                              Active
                            </span>
                          )}
                          {item.status === "SCHEDULED" && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-950/60 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              <Clock className="h-3 w-3" />
                              Scheduled
                            </span>
                          )}
                          {item.status === "HISTORICAL" && (
                            <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              Historical
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">
                          {item.notes || <span className="text-slate-400 italic">None recorded</span>}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400">
                          <div>{item.created_by_name || "System"}</div>
                          <div className="text-[11px] text-slate-400">{formatDate(item.created_at)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No monthly contribution rate history records found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CMS PAGES */}
      {activeTab === "cms" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Page Selector Sidebar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-2 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 px-2">
              Website Pages
            </div>
            {pages.map((p) => (
              <button
                key={p.slug}
                onClick={() => handleSelectPage(p.slug)}
                className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors text-left ${
                  selectedSlug === p.slug
                    ? "bg-emerald-50 text-emerald-800 font-semibold dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <span>{p.title}</span>
                <span className="text-[11px] text-slate-400 font-mono">/{p.slug}</span>
              </button>
            ))}
          </div>

          {/* CMS Page Content Editor */}
          <div className="lg:col-span-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {cmsLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600 dark:text-emerald-400" />
                <span className="ml-3 text-slate-600 dark:text-slate-300 font-medium">Loading page content...</span>
              </div>
            ) : currentPage ? (
              <form onSubmit={handleSavePage} className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Editing: {currentPage.title}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Public URL: <code className="text-emerald-700 dark:text-emerald-400 font-mono">{getPublicPath(selectedSlug)}</code>
                    </p>
                  </div>

                  <Link
                    href={getPublicPath(selectedSlug)}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Preview Live
                  </Link>
                </div>

                {pageSuccess && (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200">
                    <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                    <span>{pageSuccess}</span>
                  </div>
                )}

                {pageError && (
                  <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200">
                    <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />
                    <span>{pageError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                      Page Title *
                    </label>
                    <input
                      required
                      type="text"
                      value={currentPage.title || ""}
                      onChange={(e) => setCurrentPage({ ...currentPage, title: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                      Header Subtitle
                    </label>
                    <input
                      type="text"
                      value={currentPage.subtitle || ""}
                      onChange={(e) => setCurrentPage({ ...currentPage, subtitle: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Banner Background Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={currentPage.banner_image_url || ""}
                    onChange={(e) => setCurrentPage({ ...currentPage, banner_image_url: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      Page Main Content (Markdown Supported) *
                    </label>
                    <span className="text-[11px] text-slate-400">Supports headers (#), lists (-), bold (**)</span>
                  </div>
                  <textarea
                    required
                    rows={12}
                    value={currentPage.content || ""}
                    onChange={(e) => setCurrentPage({ ...currentPage, content: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-mono text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                      SEO Meta Title
                    </label>
                    <input
                      type="text"
                      value={currentPage.meta_title || ""}
                      onChange={(e) => setCurrentPage({ ...currentPage, meta_title: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                      SEO Meta Description
                    </label>
                    <input
                      type="text"
                      value={currentPage.meta_description || ""}
                      onChange={(e) => setCurrentPage({ ...currentPage, meta_description: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_published"
                      checked={currentPage.is_published}
                      onChange={(e) => setCurrentPage({ ...currentPage, is_published: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <label htmlFor="is_published" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Page is Published & visible to public
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={pageSaving}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 shadow-sm disabled:opacity-50 transition-colors"
                  >
                    {pageSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Publish Updates
                  </button>
                </div>
              </form>
            ) : (
              <div className="py-12 text-center text-slate-400">
                Select a page from the list to edit its content.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
