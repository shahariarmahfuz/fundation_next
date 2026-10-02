"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardDonationsNewRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/donations/new");
  }, [router]);

  return null;
}
