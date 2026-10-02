"use client";

import { useState, useEffect } from "react";
import { api } from "./api";

export interface PublicPageData {
  title: string;
  subtitle?: string;
  content?: string;
  banner_image_url?: string;
  is_published?: boolean;
}

export interface OrganizationData {
  name: string;
  tagline?: string;
  logo_url?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  social_links?: Record<string, string>;
  currency_symbol?: string;
  currency_code?: string;
}

export function usePublicPage(slug: string, fallback: PublicPageData) {
  const [page, setPage] = useState<PublicPageData>(fallback);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api
      .get(`/public/pages/${slug}`)
      .then((res) => {
        if (isMounted && res && res.is_published !== false) {
          setPage(res);
        }
      })
      .catch(() => {
        // Retain fallback silently if network error or page not found
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  return { page, loading };
}

export function useOrganization(fallback: OrganizationData) {
  const [org, setOrg] = useState<OrganizationData>(fallback);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api
      .get("/organization")
      .then((res) => {
        if (isMounted && res && res.name) {
          setOrg(res);
        }
      })
      .catch(() => {
        // Retain fallback
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { org, loading };
}
