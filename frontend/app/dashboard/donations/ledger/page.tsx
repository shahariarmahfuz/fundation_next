"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardDonationsLedgerRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/donations/ledger");
  }, [router]);

  return null;
}
