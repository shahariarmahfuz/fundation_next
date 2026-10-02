"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardDonationsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/donations");
  }, [router]);

  return null;
}
