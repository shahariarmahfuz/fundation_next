"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DonationsAddRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/donations/new");
  }, [router]);

  return null;
}
