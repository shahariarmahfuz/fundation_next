"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardContributionsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/contributions");
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300">
      <div className="text-xs">Redirecting to contributions...</div>
    </div>
  );
}
