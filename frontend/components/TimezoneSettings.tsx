"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Clock,
  Globe,
  Search,
  Check,
  ChevronDown,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  Info,
  Calendar
} from "lucide-react";
import { api } from "@/lib/api";
import { useBranding } from "@/lib/branding";
import {
  COMMON_TIMEZONES,
  getAllAvailableTimezones,
  getFoundationTimezone,
  setFoundationTimezone,
  getFoundationTimePreview,
  getTimezoneUtcOffset,
  isValidTimezone,
  TimezoneOption
} from "@/lib/timezone";

interface TimezoneSettingsProps {
  canManage: boolean;
}

export const TimezoneSettings: React.FC<TimezoneSettingsProps> = ({ canManage }) => {
  const { refreshBranding } = useBranding();

  // State
  const [activeTimezone, setActiveTimezone] = useState<string>(getFoundationTimezone());
  const [selectedTimezone, setSelectedTimezone] = useState<string>(getFoundationTimezone());
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentTimeDisplay, setCurrentTimeDisplay] = useState<string>("");
  const [utcOffsetDisplay, setUtcOffsetDisplay] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [availableTimezones, setAvailableTimezones] = useState<TimezoneOption[]>(COMMON_TIMEZONES);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch current timezone configuration from backend
  const fetchTimezoneSettings = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.get("/settings/timezone");
      if (data && data.timezone) {
        setActiveTimezone(data.timezone);
        setSelectedTimezone(data.timezone);
        setFoundationTimezone(data.timezone);
      }
      if (data && data.all_timezones && Array.isArray(data.all_timezones)) {
        setAvailableTimezones(data.all_timezones);
      } else {
        setAvailableTimezones(getAllAvailableTimezones());
      }
    } catch (err: any) {
      // Fallback to local timezone helper
      const localTz = getFoundationTimezone();
      setActiveTimezone(localTz);
      setSelectedTimezone(localTz);
      setAvailableTimezones(getAllAvailableTimezones());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimezoneSettings();
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Live ticking clock for selected timezone
  useEffect(() => {
    const updatePreview = () => {
      setCurrentTimeDisplay(getFoundationTimePreview(selectedTimezone));
      setUtcOffsetDisplay(getTimezoneUtcOffset(selectedTimezone));
    };

    updatePreview();
    const interval = setInterval(updatePreview, 1000);
    return () => clearInterval(interval);
  }, [selectedTimezone]);

  // Filtered timezone options
  const filteredTimezones = useMemo(() => {
    if (!searchQuery.trim()) {
      return availableTimezones;
    }
    const q = searchQuery.toLowerCase().trim();
    return availableTimezones.filter(
      (tz) =>
        tz.identifier.toLowerCase().includes(q) ||
        tz.label.toLowerCase().includes(q)
    );
  }, [availableTimezones, searchQuery]);

  const handleSelectTimezone = (tzIdentifier: string) => {
    setSelectedTimezone(tzIdentifier);
    setIsDropdownOpen(false);
    setSearchQuery("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;

    if (!isValidTimezone(selectedTimezone)) {
      setErrorMessage("Please select a valid official IANA timezone identifier.");
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await api.put("/settings/timezone", {
        timezone: selectedTimezone,
      });

      const updatedTz = res.timezone || selectedTimezone;
      setActiveTimezone(updatedTz);
      setSelectedTimezone(updatedTz);
      setFoundationTimezone(updatedTz);

      await refreshBranding();

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("foundation-timezone-updated", {
            detail: { timezone: updatedTz },
          })
        );
        window.dispatchEvent(new Event("foundation-profile-updated"));
      }

      setSuccessMessage(`Foundation global timezone successfully set to ${updatedTz}`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update Foundation timezone. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const selectedTzObj = useMemo(() => {
    return (
      availableTimezones.find((t) => t.identifier === selectedTimezone) || {
        identifier: selectedTimezone,
        label: selectedTimezone,
      }
    );
  }, [availableTimezones, selectedTimezone]);

  const hasUnsavedChanges = selectedTimezone !== activeTimezone;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Banner / Explanatory Header */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <Globe className="h-5 w-5" />
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Global Timezone Configuration
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
              Configure the single source of truth timezone for the entire Foundation Management System.
              All business operations, financial dates, ledger records, reports, and dashboards will operate on this local time.
            </p>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300 w-fit shrink-0">
            <ShieldCheck className="h-3.5 w-3.5" />
            Official IANA Database
          </span>
        </div>

        {/* Live Preview Card */}
        <div className="mt-6 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60 bg-gradient-to-br from-emerald-50/70 via-slate-50/50 to-white dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
                Current Foundation Time
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                {utcOffsetDisplay || "UTC+06:00"}
              </span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {selectedTimezone}
              </span>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
              {currentTimeDisplay || "03 October 2026, 10:30 PM"}
            </div>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              {hasUnsavedChanges ? (
                <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Live preview for uncommitted selection: {selectedTimezone}. Click &ldquo;Save Timezone&rdquo; below to apply Foundation-wide.
                </span>
              ) : (
                <span className="text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Active system timezone: {activeTimezone}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Success / Error Alerts */}
        {successMessage && (
          <div className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200">
            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mt-5 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Quick Selection Shortcuts */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
            Recommended / Common Timezones
          </label>
          <div className="flex flex-wrap gap-2">
            {COMMON_TIMEZONES.slice(0, 7).map((item) => {
              const isSelected = selectedTimezone === item.identifier;
              return (
                <button
                  key={item.identifier}
                  type="button"
                  onClick={() => handleSelectTimezone(item.identifier)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-emerald-600 text-white shadow-xs font-semibold"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300"
                  }`}
                >
                  {isSelected && <Check className="h-3 w-3" />}
                  <span>{item.label.split(" — ")[0]}</span>
                  <span className="text-[10px] opacity-75">({item.label.split(" — ")[1]?.split(" ")[0]})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Searchable Timezone Dropdown */}
        <form onSubmit={handleSave} className="mt-6 space-y-5">
          <div className="space-y-1.5 relative" ref={dropdownRef}>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Select Official IANA Timezone *
            </label>

            {/* Custom Dropdown Trigger */}
            <div
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`w-full flex items-center justify-between cursor-pointer rounded-xl border bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white transition-colors ${
                isDropdownOpen
                  ? "border-emerald-500 ring-2 ring-emerald-500/20"
                  : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Globe className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-semibold truncate">{selectedTzObj.label}</span>
                <span className="text-xs text-slate-400 font-mono">({selectedTzObj.identifier})</span>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                  isDropdownOpen ? "rotate-180 text-emerald-600" : ""
                }`}
              />
            </div>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute z-30 left-0 right-0 mt-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
                {/* Search Bar inside Dropdown */}
                <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <div className="relative">
                    <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      autoFocus
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search timezone by city, country, or identifier (e.g. Dhaka, London, Tokyo, New York)..."
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* List items */}
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredTimezones.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No matching timezones found for &ldquo;{searchQuery}&rdquo;.
                    </div>
                  ) : (
                    filteredTimezones.map((tz) => {
                      const isCurrent = tz.identifier === selectedTimezone;
                      return (
                        <button
                          key={tz.identifier}
                          type="button"
                          onClick={() => handleSelectTimezone(tz.identifier)}
                          className={`w-full flex items-center justify-between px-3.5 py-2 text-xs text-left transition-colors ${
                            isCurrent
                              ? "bg-emerald-50 text-emerald-900 font-semibold dark:bg-emerald-950/60 dark:text-emerald-200"
                              : "hover:bg-slate-50 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                          }`}
                        >
                          <div className="flex flex-col min-w-0">
                            <span className="truncate">{tz.label}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {tz.identifier}
                            </span>
                          </div>
                          {isCurrent && <Check className="h-4 w-4 text-emerald-600 shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
              Official IANA Time Zone Database format (e.g. <code>Asia/Dhaka</code>, <code>Europe/London</code>, <code>America/New_York</code>). Raw UTC offsets are never used as identifiers.
            </p>
          </div>

          {/* Strict Data Integrity Guarantee Box */}
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 p-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100">
              <Info className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Application-Wide Timezone Single Source of Truth
            </div>
            <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-slate-500 dark:text-slate-400">
              <li>
                <strong>Database Timestamps:</strong> All timestamps remain consistently stored in UTC to guarantee immutable financial audit trails.
              </li>
              <li>
                <strong>Automatic Conversion:</strong> Member registration dates, contributions, donations, expenses, Qard Hasan disbursements, and ledgers automatically display in the configured Foundation timezone.
              </li>
              <li>
                <strong>Default Form Dates:</strong> New contribution, donation, and expense forms will automatically default to Today in this Foundation timezone.
              </li>
            </ul>
          </div>

          {/* Action Button */}
          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={saving || !canManage || loading}
              className={`inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all ${
                hasUnsavedChanges
                  ? "bg-emerald-600 hover:bg-emerald-700 animate-pulse"
                  : "bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving Timezone...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{hasUnsavedChanges ? "Save Selected Timezone" : "Save Timezone"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
