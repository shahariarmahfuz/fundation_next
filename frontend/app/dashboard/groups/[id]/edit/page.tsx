"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function DashboardGroupEditRedirect() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    if (params?.id) {
      router.replace(`/admin/groups/${params.id}/edit`);
    } else {
      router.replace("/admin/groups");
    }
  }, [params, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300">
      <div className="text-xs">Redirecting to group edit page...</div>
    </div>
  );
}
