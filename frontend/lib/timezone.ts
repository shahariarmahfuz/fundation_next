/**
 * Centralized Foundation Global Timezone Management
 * Single source of truth for date and time calculations and display across the application.
 */

export const DEFAULT_FOUNDATION_TIMEZONE = "Asia/Dhaka";
export const TIMEZONE_STORAGE_KEY = "foundation_timezone";

export interface TimezoneOption {
  identifier: string;
  label: string;
  offset?: string;
}

export const COMMON_TIMEZONES: TimezoneOption[] = [
  { identifier: "Asia/Dhaka", label: "Asia/Dhaka — Bangladesh" },
  { identifier: "Asia/Kolkata", label: "Asia/Kolkata — India" },
  { identifier: "Asia/Dubai", label: "Asia/Dubai — UAE" },
  { identifier: "Asia/Riyadh", label: "Asia/Riyadh — Saudi Arabia" },
  { identifier: "Asia/Qatar", label: "Asia/Qatar — Qatar" },
  { identifier: "Asia/Karachi", label: "Asia/Karachi — Pakistan" },
  { identifier: "Asia/Singapore", label: "Asia/Singapore — Singapore" },
  { identifier: "Asia/Kuala_Lumpur", label: "Asia/Kuala_Lumpur — Malaysia" },
  { identifier: "Asia/Jakarta", label: "Asia/Jakarta — Indonesia" },
  { identifier: "Asia/Tokyo", label: "Asia/Tokyo — Japan" },
  { identifier: "Europe/London", label: "Europe/London — United Kingdom" },
  { identifier: "Europe/Berlin", label: "Europe/Berlin — Germany" },
  { identifier: "Europe/Paris", label: "Europe/Paris — France" },
  { identifier: "Europe/Istanbul", label: "Europe/Istanbul — Turkey" },
  { identifier: "America/New_York", label: "America/New_York — United States (Eastern)" },
  { identifier: "America/Chicago", label: "America/Chicago — United States (Central)" },
  { identifier: "America/Denver", label: "America/Denver — United States (Mountain)" },
  { identifier: "America/Los_Angeles", label: "America/Los_Angeles — United States (Pacific)" },
  { identifier: "America/Toronto", label: "America/Toronto — Canada" },
  { identifier: "Australia/Sydney", label: "Australia/Sydney — Australia" },
  { identifier: "Africa/Cairo", label: "Africa/Cairo — Egypt" },
  { identifier: "UTC", label: "UTC — Coordinated Universal Time" },
];

/**
 * Validates if a timezone identifier is supported by the JavaScript Intl API.
 */
export function isValidTimezone(tz: string): boolean {
  if (!tz || typeof tz !== "string") return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz.trim() });
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns all IANA timezones supported by runtime.
 */
export function getAllAvailableTimezones(): TimezoneOption[] {
  let list: string[] = [];
  try {
    if (typeof Intl !== "undefined" && typeof (Intl as any).supportedValuesOf === "function") {
      list = (Intl as any).supportedValuesOf("timeZone");
    }
  } catch {
    list = [];
  }

  if (!list || list.length === 0) {
    return COMMON_TIMEZONES;
  }

  // Create lookup for friendly names
  const friendlyMap = new Map<string, string>();
  for (const item of COMMON_TIMEZONES) {
    friendlyMap.set(item.identifier, item.label);
  }

  return list.map((identifier) => ({
    identifier,
    label: friendlyMap.get(identifier) || identifier.replace(/_/g, " "),
  }));
}

/**
 * Retrieves the currently active Foundation timezone.
 * Priority: localStorage -> window context / default (Asia/Dhaka).
 */
export function getFoundationTimezone(): string {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(TIMEZONE_STORAGE_KEY);
      if (stored && isValidTimezone(stored)) {
        return stored.trim();
      }
    } catch {
      // ignore localStorage exceptions
    }
  }
  return DEFAULT_FOUNDATION_TIMEZONE;
}

/**
 * Sets the local copy of the foundation timezone and notifies all tabs / components.
 */
export function setFoundationTimezone(tz: string): void {
  if (!isValidTimezone(tz)) return;
  const cleanTz = tz.trim();
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(TIMEZONE_STORAGE_KEY, cleanTz);
      window.dispatchEvent(new CustomEvent("foundation-timezone-updated", { detail: { timezone: cleanTz } }));
      window.dispatchEvent(new Event("foundation-profile-updated"));
    } catch {
      // ignore
    }
  }
}

/**
 * Returns formatted UTC offset string (e.g. "UTC+06:00" or "UTC-05:00") for a timezone.
 */
export function getTimezoneUtcOffset(tz?: string, date = new Date()): string {
  const timeZone = tz && isValidTimezone(tz) ? tz : getFoundationTimezone();
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "shortOffset",
    }).formatToParts(date);
    const tzPart = parts.find((p) => p.type === "timeZoneName");
    if (tzPart && tzPart.value) {
      return tzPart.value.replace(/GMT/, "UTC");
    }
  } catch {
    // fallback
  }
  return "UTC";
}

/**
 * Formats a live preview matching the requirement:
 * "03 October 2026, 10:30 PM"
 */
export function getFoundationTimePreview(tz?: string, date = new Date()): string {
  const timeZone = tz && isValidTimezone(tz) ? tz : getFoundationTimezone();
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).formatToParts(date);

    let day = "";
    let month = "";
    let year = "";
    let hour = "";
    let minute = "";
    let dayPeriod = "";

    for (const p of parts) {
      if (p.type === "day") day = p.value;
      if (p.type === "month") month = p.value;
      if (p.type === "year") year = p.value;
      if (p.type === "hour") hour = p.value;
      if (p.type === "minute") minute = p.value;
      if (p.type === "dayPeriod") dayPeriod = p.value.toUpperCase();
    }

    return `${day} ${month} ${year}, ${hour}:${minute} ${dayPeriod}`;
  } catch {
    return date.toLocaleString();
  }
}

/**
 * Returns standard ISO date string "YYYY-MM-DD" representing TODAY in the Foundation timezone.
 */
export function getFoundationTodayDate(tz?: string): string {
  const timeZone = tz && isValidTimezone(tz) ? tz : getFoundationTimezone();
  try {
    const now = new Date();
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

/**
 * Returns standard ISO month string "YYYY-MM" representing current month in the Foundation timezone.
 */
export function getFoundationCurrentMonth(tz?: string): string {
  const today = getFoundationTodayDate(tz);
  return today.substring(0, 7);
}

/**
 * Formats a date string (date-only or timestamp) in the Foundation timezone.
 * Pure calendar dates ("YYYY-MM-DD") are formatted as exact calendar dates without offset distortion.
 */
export function formatFoundationDate(dateStr: string | null | undefined, tz?: string): string {
  if (!dateStr) return "-";
  try {
    // Pure date-only string like "2026-10-03"
    if (typeof dateStr === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split("-").map(Number);
      const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      return d.toLocaleDateString("en-US", {
        timeZone: "UTC",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }

    const timeZone = tz && isValidTimezone(tz) ? tz : getFoundationTimezone();
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);

    return d.toLocaleDateString("en-US", {
      timeZone,
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return String(dateStr);
  }
}

/**
 * Formats a timestamp into date + time in the Foundation timezone.
 * Example: "Oct 3, 2026, 03:30 PM"
 */
export function formatFoundationDateTime(dateStr: string | null | undefined, tz?: string): string {
  if (!dateStr) return "-";
  try {
    const timeZone = tz && isValidTimezone(tz) ? tz : getFoundationTimezone();
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);

    return d.toLocaleDateString("en-US", {
      timeZone,
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(dateStr);
  }
}
