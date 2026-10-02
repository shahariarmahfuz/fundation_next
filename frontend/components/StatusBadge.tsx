import React from "react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const s = (status || "").toUpperCase();

  let colorClasses = "bg-slate-100 text-slate-700 border-slate-200";

  if (["ACTIVE", "PAID", "APPROVED", "COMPLETED", "INFLOW"].includes(s)) {
    colorClasses = "bg-emerald-50 text-emerald-700 border-emerald-200";
  } else if (["PENDING", "CURRENT_PENDING", "DUE"].includes(s)) {
    colorClasses = "bg-amber-50 text-amber-700 border-amber-200";
  } else if (["INACTIVE", "REJECTED", "DEFAULTED", "OUTFLOW", "SUSPENDED"].includes(s)) {
    colorClasses = "bg-rose-50 text-rose-700 border-rose-200";
  } else if (["REVERSAL", "CORRECTION"].includes(s)) {
    colorClasses = "bg-purple-50 text-purple-700 border-purple-200";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        colorClasses,
        className
      )}
    >
      {s.replace(/_/g, " ")}
    </span>
  );
};
