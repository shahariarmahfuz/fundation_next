import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatFoundationDate, formatFoundationDateTime } from "./timezone";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return "৳0.00";
  }
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return "৳" + num.toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formats a date using the centralized Foundation timezone.
 * Pure calendar dates ("YYYY-MM-DD") are preserved without offset shift.
 */
export function formatDate(dateStr: string | null | undefined, timeZone?: string): string {
  return formatFoundationDate(dateStr, timeZone);
}

/**
 * Formats a timestamp into date and time in the centralized Foundation timezone.
 */
export function formatDateTime(dateStr: string | null | undefined, timeZone?: string): string {
  return formatFoundationDateTime(dateStr, timeZone);
}
