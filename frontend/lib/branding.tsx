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
      const data = await api.get("/organization");
      if (data) {
        setBranding((prev) => ({
          ...prev,
          name: data.name?.trim() || "Al-Birr Foundation",
          tagline: data.tagline || prev.tagline,
          logoUrl: data.logo_url || null,
          logoPublicId: data.logo_public_id || null,
          currencySymbol: data.currency_symbol || "৳",
          currencyCode: data.currency_code || "BDT",
          loading: false,
        }));
      }
    } catch {
      // Fallback silently to safe defaults
      setBranding((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    fetchBranding();
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
