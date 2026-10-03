"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "./api";
import { DEFAULT_FOUNDATION_TIMEZONE, setFoundationTimezone, getFoundationTimezone } from "./timezone";

export interface BrandingData {
  name: string;
  tagline: string;
  logoUrl: string | null;
  logoPublicId?: string | null;
  currencySymbol: string;
  currencyCode: string;
  timezone: string;
  loading: boolean;
  refreshBranding: () => Promise<void>;
}

const defaultBranding: BrandingData = {
  name: "Al-Birr Foundation",
  tagline: "Empowering Communities Through Islamic Finance & Charity",
  logoUrl: null,
  logoPublicId: null,
  currencySymbol: "৳",
  currencyCode: "BDT",
  timezone: DEFAULT_FOUNDATION_TIMEZONE,
  loading: true,
  refreshBranding: async () => {},
};

const BrandingContext = createContext<BrandingData>(defaultBranding);

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState<{
    name: string;
    tagline: string;
    logoUrl: string | null;
    logoPublicId: string | null;
    currencySymbol: string;
    currencyCode: string;
    timezone: string;
    loading: boolean;
  }>({
    name: "Al-Birr Foundation",
    tagline: "Empowering Communities Through Islamic Finance & Charity",
    logoUrl: null,
    logoPublicId: null,
    currencySymbol: "৳",
    currencyCode: "BDT",
    timezone: getFoundationTimezone(),
    loading: true,
  });

  const fetchBranding = useCallback(async () => {
    try {
      const data = await api.get("/organization", { cache: "no-store" });
      if (data) {
        const tz = data.timezone || DEFAULT_FOUNDATION_TIMEZONE;
        setFoundationTimezone(tz);
        setBranding({
          name: data.name?.trim() || "Foundation",
          tagline: data.tagline || "Empowering Communities Through Islamic Finance & Charity",
          logoUrl: data.logo_url || null,
          logoPublicId: data.logo_public_id || null,
          currencySymbol: data.currency_symbol || "৳",
          currencyCode: data.currency_code || "BDT",
          timezone: tz,
          loading: false,
        });
      }
    } catch {
      // Fallback silently to safe defaults
      setBranding((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    fetchBranding();
    const handleUpdate = () => {
      fetchBranding();
    };
    const handleTzUpdate = (e: any) => {
      if (e?.detail?.timezone) {
        setBranding((prev) => ({ ...prev, timezone: e.detail.timezone }));
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("foundation-profile-updated", handleUpdate);
      window.addEventListener("foundation-timezone-updated", handleTzUpdate);
      window.addEventListener("storage", handleUpdate);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("foundation-profile-updated", handleUpdate);
        window.removeEventListener("foundation-timezone-updated", handleTzUpdate);
        window.removeEventListener("storage", handleUpdate);
      }
    };
  }, [fetchBranding]);

  return (
    <BrandingContext.Provider
      value={{
        ...branding,
        refreshBranding: fetchBranding,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => useContext(BrandingContext);
