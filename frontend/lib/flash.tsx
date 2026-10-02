"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export type FlashType = "success" | "error" | "warning" | "info";

export interface FlashDetail {
  label: string;
  value: string;
}

export interface FlashOptions {
  title: string;
  message?: string;
  details?: FlashDetail[] | Record<string, string>;
  duration?: number;
}

export interface FlashItem {
  id: string;
  type: FlashType;
  title: string;
  message?: string;
  details?: FlashDetail[];
  duration: number;
  exiting?: boolean;
}

export interface FlashContextType {
  flash: {
    success: (title: string, message?: string, options?: Partial<FlashOptions>) => string;
    error: (title: string, message?: string, options?: Partial<FlashOptions>) => string;
    warning: (title: string, message?: string, options?: Partial<FlashOptions>) => string;
    info: (title: string, message?: string, options?: Partial<FlashOptions>) => string;
    show: (type: FlashType, options: FlashOptions) => string;
    dismiss: (id: string) => void;
    clear: () => void;
  };
}

const FlashContext = createContext<FlashContextType | undefined>(undefined);

export function getUserFriendlyErrorMessage(error: any): string {
  if (!error) return "An unexpected error occurred. Please try again.";
  
  if (typeof error === "string") {
    if (error.includes("status 500") || error.includes("Internal Server Error")) {
      return "A temporary server issue occurred. Please try again shortly.";
    }
    if (error.includes("status 403") || error.includes("Forbidden")) {
      return "You do not have permission to perform this action.";
    }
    if (error.includes("status 401") || error.includes("Unauthorized")) {
      return "Your session has expired. Please log in again.";
    }
    if (error.includes("Network Error") || error.includes("Failed to fetch")) {
      return "Unable to reach server. Please check your internet connection.";
    }
    return error;
  }

  const rawMsg = error.message || error.detail || "";
  if (typeof rawMsg === "string") {
    if (rawMsg.includes("status 500") || rawMsg.includes("Internal Server Error")) {
      return "A temporary server issue occurred. Please try again shortly.";
    }
    if (rawMsg.includes("status 403")) {
      return "You do not have permission to perform this action.";
    }
    if (rawMsg.includes("status 401")) {
      return "Your session has expired. Please log in again.";
    }
    if (rawMsg.includes("Failed to fetch") || rawMsg.includes("Network Error")) {
      return "Unable to connect to the server. Please check your connection.";
    }
    if (rawMsg) return rawMsg;
  }

  if (Array.isArray(error.detail)) {
    return error.detail.map((e: any) => e.msg || JSON.stringify(e)).join(", ");
  }

  return "An unexpected error occurred. Please try again.";
}

function normalizeDetails(details?: FlashDetail[] | Record<string, string>): FlashDetail[] | undefined {
  if (!details) return undefined;
  if (Array.isArray(details)) return details;
  return Object.entries(details).map(([label, value]) => ({ label, value }));
}

export const FlashProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<FlashItem[]>([]);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const removeImmediately = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const dismiss = useCallback((id: string) => {
    // Set exiting animation state
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, exiting: true } : m))
    );
    // Allow 200ms exit transition to complete before removing from DOM
    setTimeout(() => {
      removeImmediately(id);
    }, 200);
  }, [removeImmediately]);

  const clear = useCallback(() => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
    setMessages([]);
  }, []);

  const show = useCallback(
    (type: FlashType, options: FlashOptions): string => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      // 4.5s for success/info, 7s for warnings/errors
      const duration = options.duration ?? (type === "success" || type === "info" ? 4500 : 7000);

      const newItem: FlashItem = {
        id,
        type,
        title: options.title,
        message: options.message,
        details: normalizeDetails(options.details),
        duration,
        exiting: false,
      };

      setMessages((prev) => {
        // Keep up to 3 most recent toasts to prevent screen clutter
        const next = [newItem, ...prev.filter((m) => !m.exiting)].slice(0, 3);
        return next;
      });

      if (duration > 0) {
        const timer = setTimeout(() => {
          dismiss(id);
        }, duration);
        timersRef.current.set(id, timer);
      }

      return id;
    },
    [dismiss]
  );

  const success = useCallback(
    (title: string, message?: string, options?: Partial<FlashOptions>) =>
      show("success", { title, message, ...options }),
    [show]
  );

  const error = useCallback(
    (title: string, message?: string, options?: Partial<FlashOptions>) =>
      show("error", { title, message, ...options }),
    [show]
  );

  const warning = useCallback(
    (title: string, message?: string, options?: Partial<FlashOptions>) =>
      show("warning", { title, message, ...options }),
    [show]
  );

  const info = useCallback(
    (title: string, message?: string, options?: Partial<FlashOptions>) =>
      show("info", { title, message, ...options }),
    [show]
  );

  // Clean up all timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current.clear();
    };
  }, []);

  return (
    <FlashContext.Provider
      value={{
        flash: {
          success,
          error,
          warning,
          info,
          show,
          dismiss,
          clear,
        },
      }}
    >
      {children}
      <FlashContainer messages={messages} onDismiss={dismiss} />
    </FlashContext.Provider>
  );
};

export const useFlash = () => {
  const context = useContext(FlashContext);
  if (!context) {
    throw new Error("useFlash must be used within a FlashProvider");
  }
  return context;
};

// Centralized Floating Toast Viewport
const FlashContainer: React.FC<{
  messages: FlashItem[];
  onDismiss: (id: string) => void;
}> = ({ messages, onDismiss }) => {
  if (messages.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed z-50 pointer-events-none flex flex-col gap-2.5 top-4 inset-x-4 sm:top-5 sm:right-5 sm:left-auto sm:inset-x-auto sm:w-[26rem] max-w-full"
    >
      {messages.map((item) => (
        <FlashCard key={item.id} item={item} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const FlashCard: React.FC<{
  item: FlashItem;
  onDismiss: (id: string) => void;
}> = ({ item, onDismiss }) => {
  const isExiting = item.exiting;

  const styleConfig = {
    success: {
      border: "border-emerald-200 dark:border-emerald-900/50",
      bg: "bg-white/98 dark:bg-[#0D0D0D]/98",
      iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-950/40",
      accentBar: "bg-emerald-500",
      Icon: CheckCircle2,
      shadow: "shadow-emerald-500/5",
      titleColor: "text-slate-900 dark:text-[#F5F5F5]",
    },
    error: {
      border: "border-rose-200 dark:border-rose-900/50",
      bg: "bg-white/98 dark:bg-[#0D0D0D]/98",
      iconBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 dark:bg-rose-950/40",
      accentBar: "bg-rose-500",
      Icon: AlertCircle,
      shadow: "shadow-rose-500/5",
      titleColor: "text-slate-900 dark:text-[#F5F5F5]",
    },
    warning: {
      border: "border-amber-200 dark:border-amber-900/50",
      bg: "bg-white/98 dark:bg-[#0D0D0D]/98",
      iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 dark:bg-amber-950/40",
      accentBar: "bg-amber-500",
      Icon: AlertTriangle,
      shadow: "shadow-amber-500/5",
      titleColor: "text-slate-900 dark:text-[#F5F5F5]",
    },
    info: {
      border: "border-sky-200 dark:border-sky-900/50",
      bg: "bg-white/98 dark:bg-[#0D0D0D]/98",
      iconBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400 dark:bg-sky-950/40",
      accentBar: "bg-sky-500",
      Icon: Info,
      shadow: "shadow-sky-500/5",
      titleColor: "text-slate-900 dark:text-[#F5F5F5]",
    },
  }[item.type];

  const IconComponent = styleConfig.Icon;

  return (
    <div
      role={item.type === "error" ? "alert" : "status"}
      className={`pointer-events-auto relative overflow-hidden rounded-2xl border ${styleConfig.border} ${styleConfig.bg} p-4 shadow-xl ${styleConfig.shadow} backdrop-blur-md transition-all ${
        isExiting ? "animate-flash-exit" : "animate-flash-enter"
      }`}
    >
      {/* Top Accent Line */}
      <div className={`absolute top-0 inset-x-0 h-1 ${styleConfig.accentBar}`} />

      <div className="flex items-start gap-3">
        {/* Status Icon */}
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${styleConfig.iconBg} shadow-sm`}
        >
          <IconComponent className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-1">
          <h4 className={`text-sm font-bold tracking-tight ${styleConfig.titleColor}`}>
            {item.title}
          </h4>

          {item.message && (
            <p className="mt-0.5 text-xs text-slate-600 dark:text-[#A3A3A3] leading-relaxed break-words">
              {item.message}
            </p>
          )}

          {/* Optional Details Pills */}
          {item.details && item.details.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 dark:border-[#1A1A1A]">
              {item.details.map((detail, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 dark:border-[#242424] bg-slate-50 dark:bg-[#151515] px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:text-[#D4D4D4]"
                >
                  <span className="text-slate-400 dark:text-[#737373] font-normal">{detail.label}:</span>
                  <span className="font-semibold font-mono">{detail.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={() => onDismiss(item.id)}
          aria-label="Dismiss notification"
          className="shrink-0 rounded-lg p-1 text-slate-400 hover:text-slate-700 dark:text-[#737373] dark:hover:text-[#F5F5F5] hover:bg-slate-100 dark:hover:bg-[#151515] transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
