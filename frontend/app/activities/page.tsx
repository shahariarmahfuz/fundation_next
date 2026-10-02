"use client";

import React from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Stethoscope, GraduationCap, Flame, ShoppingBag } from "lucide-react";
import { usePublicPage } from "@/lib/useCms";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

export default function ActivitiesPage() {
  const { page } = usePublicPage("activities", {
    title: "Our Programs & Field Activities",
    subtitle: "Real initiatives transforming the lives of individuals, children, and communities every day.",
  });

  const defaultActivities = [
    {
      title: "Qard Hasan Micro-Enterprise Fund",
      icon: ShoppingBag,
      color: "text-blue-600 bg-blue-100",
      desc: "Disbursing small, interest-free capital installments (৳5,000 to ৳50,000) for tea stall vendors, small farmers, and tailors. Repayments return directly to the group account to fund subsequent applicants.",
    },
    {
      title: "Medical & Prescription Subsidies",
      icon: Stethoscope,
      color: "text-emerald-600 bg-emerald-100",
      desc: "Providing medicine packages, pathological test coverage, and hospital admission grants for low-income patients battling acute or chronic illnesses.",
    },
    {
      title: "Student Education Scholarships",
      icon: GraduationCap,
      color: "text-amber-600 bg-amber-100",
      desc: "Monthly stipends supporting underprivileged students at schools, colleges, and madrasahs to eliminate dropout rates and encourage academic excellence.",
    },
    {
      title: "Disaster Relief & Emergency Sadakah",
      icon: Flame,
      color: "text-rose-600 bg-rose-100",
      desc: "Instant relief packages during seasonal floods, cold waves, and residential fire disasters, distributing dry rations, warm blankets, and temporary shelter repair kits.",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-10 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-foundation-700">Impact in Action</span>
            <h1 className="mt-2 text-2xl sm:text-4xl font-extrabold text-slate-900">
              {page.title}
            </h1>
            {page.subtitle && (
              <p className="mt-3 text-base text-slate-600 leading-relaxed">
                {page.subtitle}
              </p>
            )}

            <div className="mt-10">
              {page.content ? (
                <MarkdownRenderer content={page.content} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {defaultActivities.map((act, idx) => {
                    const Icon = act.icon;
                    return (
                      <div key={idx} className="rounded-xl border border-slate-200 p-6 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${act.color} mb-4`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <h3 className="font-bold text-slate-900 text-base">{act.title}</h3>
                        <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">{act.desc}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
