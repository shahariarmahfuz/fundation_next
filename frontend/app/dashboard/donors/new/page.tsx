"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardDonorsNewRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/donors/new");
  }, [router]);

  return null;
}
