"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "./api";

export interface BrandingData {
  name: string;
  tagline: string;
  logoUrl: string | null;
  logoPublicId?: string | null;
  currencySymbol: string;
  currencyCode: string;
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
    loading: boolean;
  }>({
    name: "Al-Birr Foundation",
    tagline: "Empowering Communities Through Islamic Finance & Charity",
    logoUrl: null,
    logoPublicId: null,
    currencySymbol: "৳",
    currencyCode: "BDT",
    loading: true,
  });

  const fetchBranding = useCallback(async () => {
    try {
      const data = await api.get("/organization", { cache: "no-store" });
      if (data) {
        setBranding({
          name: data.name?.trim() || "Foundation",
          tagline: data.tagline || "Empowering Communities Through Islamic Finance & Charity",
          logoUrl: data.logo_url || null,
          logoPublicId: data.logo_public_id || null,
          currencySymbol: data.currency_symbol || "৳",
          currencyCode: data.currency_code || "BDT",
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
    if (typeof window !== "undefined") {
      window.addEventListener("foundation-profile-updated", handleUpdate);
      window.addEventListener("storage", handleUpdate);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("foundation-profile-updated", handleUpdate);
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
