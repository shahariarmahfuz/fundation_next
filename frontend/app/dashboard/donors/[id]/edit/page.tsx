"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function DashboardDonorEditRedirect() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    if (id) {
      router.replace(`/admin/donors/${id}/edit`);
    }
  }, [id, router]);

  return null;
}
