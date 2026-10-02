"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function DashboardMemberEditRedirect() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    if (params?.id) {
      router.replace(`/admin/members/${params.id}/edit`);
    } else {
      router.replace("/admin/members");
    }
  }, [params, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300">
      <div className="text-xs">Redirecting to member edit page...</div>
    </div>
  );
}
