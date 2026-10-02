"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
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
  Eye
} from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"org" | "cms">("org");

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
    fetchOrg();
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
      // refresh list
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
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Settings & CMS Content Management
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Configure organization profile, financial currency defaults, and public website pages
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("org")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "org"
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Building2 className="h-4 w-4" />
          Foundation Profile & Details
        </button>

        <button
          onClick={() => setActiveTab("cms")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "cms"
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <FileEdit className="h-4 w-4" />
          Public Website CMS Pages
        </button>
      </div>

      {/* TAB 1: ORGANIZATION PROFILE */}
      {activeTab === "org" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm max-w-4xl">
          {orgLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <span className="ml-3 text-slate-600 font-medium">Loading organization profile...</span>
            </div>
          ) : (
            <form onSubmit={handleSaveOrg} className="space-y-6">
              {orgSuccess && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800">
                  <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <span>{orgSuccess}</span>
                </div>
              )}

              {orgError && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-800">
                  <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />
                  <span>{orgError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Organization Official Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={orgData.name || ""}
                    onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Tagline / Motto
                  </label>
                  <input
                    type="text"
                    value={orgData.tagline || ""}
                    onChange={(e) => setOrgData({ ...orgData, tagline: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Foundation Overview / Mission Summary
                </label>
                <textarea
                  rows={3}
                  value={orgData.description || ""}
                  onChange={(e) => setOrgData({ ...orgData, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    value={orgData.email || ""}
                    onChange={(e) => setOrgData({ ...orgData, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Official Contact Phone
                  </label>
                  <input
                    type="text"
                    value={orgData.phone || ""}
                    onChange={(e) => setOrgData({ ...orgData, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={orgData.website || ""}
                    onChange={(e) => setOrgData({ ...orgData, website: e.target.value })}
                    placeholder="https://example.org"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Headquarters Physical Address
                </label>
                <input
                  type="text"
                  value={orgData.address || ""}
                  onChange={(e) => setOrgData({ ...orgData, address: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Currency Symbol
                  </label>
                  <input
                    type="text"
                    value={orgData.currency_symbol || "৳"}
                    onChange={(e) => setOrgData({ ...orgData, currency_symbol: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Currency Code
                  </label>
                  <input
                    type="text"
                    value={orgData.currency_code || "BDT"}
                    onChange={(e) => setOrgData({ ...orgData, currency_code: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
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

      {/* TAB 2: CMS PAGES */}
      {activeTab === "cms" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Page Selector Sidebar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 px-2">
              Website Pages
            </div>
            {pages.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelectPage(p.slug)}
                className={`w-full text-left rounded-xl p-3 text-sm font-medium transition-colors flex items-center justify-between ${
                  selectedSlug === p.slug
                    ? "bg-emerald-50 text-emerald-900 border border-emerald-300 font-bold"
                    : "text-slate-700 hover:bg-slate-50 border border-transparent"
                }`}
              >
                <span>{p.title}</span>
                <span className="font-mono text-2xs text-slate-400">/{p.slug}</span>
              </button>
            ))}
          </div>

          {/* Page Content Editor */}
          <div className="lg:col-span-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {currentPage ? (
              <form onSubmit={handleSavePage} className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Editing: {currentPage.title}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      URL: {getPublicPath(currentPage.slug)}
                    </p>
                  </div>

                  <Link
                    href={getPublicPath(currentPage.slug)}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Preview Live
                  </Link>
                </div>

                {pageSuccess && (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800">
                    <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                    <span>{pageSuccess}</span>
                  </div>
                )}

                {pageError && (
                  <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-800">
                    <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />
                    <span>{pageError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                      Page Title *
                    </label>
                    <input
                      required
                      type="text"
                      value={currentPage.title || ""}
                      onChange={(e) => setCurrentPage({ ...currentPage, title: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                      Subtitle / Header Teaser
                    </label>
                    <input
                      type="text"
                      value={currentPage.subtitle || ""}
                      onChange={(e) => setCurrentPage({ ...currentPage, subtitle: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Page Body Content (Markdown / Text) *
                  </label>
                  <textarea
                    required
                    rows={12}
                    value={currentPage.content || ""}
                    onChange={(e) => setCurrentPage({ ...currentPage, content: e.target.value })}
                    className="w-full font-mono text-xs rounded-xl border border-slate-300 p-3 text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                      SEO Meta Title
                    </label>
                    <input
                      type="text"
                      value={currentPage.meta_title || ""}
                      onChange={(e) => setCurrentPage({ ...currentPage, meta_title: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                      SEO Meta Description
                    </label>
                    <input
                      type="text"
                      value={currentPage.meta_description || ""}
                      onChange={(e) => setCurrentPage({ ...currentPage, meta_description: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_published"
                      checked={currentPage.is_published}
                      onChange={(e) => setCurrentPage({ ...currentPage, is_published: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <label htmlFor="is_published" className="text-sm font-medium text-slate-700">
                      Page is Published & visible to public
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={pageSaving}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 shadow-sm disabled:opacity-50"
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
