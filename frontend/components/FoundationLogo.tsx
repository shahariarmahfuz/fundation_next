"use client";

import React, { useState } from "react";
import { useBranding } from "@/lib/branding";
import { Coins, HeartHandshake } from "lucide-react";

interface FoundationLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showFallbackText?: boolean;
}

export const FoundationLogo: React.FC<FoundationLogoProps> = ({
  className = "",
  size = "md",
  showFallbackText = false,
}) => {
  const { name, logoUrl } = useBranding();
  const [imgError, setImgError] = useState(false);

  // Size mappings
  const sizeClasses = {
    sm: "h-8 w-8 text-sm",
    md: "h-9 w-9 text-base",
    lg: "h-11 w-11 text-lg",
    xl: "h-14 w-14 text-xl",
  };

  const initial = name ? name.charAt(0).toUpperCase() : "A";

  if (logoUrl && !imgError) {
    return (
      <div className={`relative flex items-center justify-center shrink-0 overflow-hidden rounded-lg ${sizeClasses[size]} ${className}`}>
        <img
          src={logoUrl}
          alt={`${name} Logo`}
          onError={() => setImgError(true)}
          className="h-full w-full object-contain"
        />
      </div>
    );
  }

  // Built-in clean fallback logo / emblem
  return (
    <div
      className={`flex items-center justify-center rounded-lg bg-emerald-600 text-white font-bold shadow-xs shrink-0 select-none ${sizeClasses[size]} ${className}`}
      title={name}
    >
      <HeartHandshake className="h-5 w-5" />
    </div>
  );
};
