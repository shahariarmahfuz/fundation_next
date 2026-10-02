"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function DashboardExpenseDetailRedirect() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    if (params?.id) {
      router.replace(`/admin/expenses/${params.id}`);
    } else {
      router.replace("/admin/expenses");
    }
  }, [router, params]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300">
      <div className="text-xs">Redirecting to Expense Details...</div>
    </div>
  );
}
