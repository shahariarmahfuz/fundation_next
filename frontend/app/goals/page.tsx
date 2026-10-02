"use client";

import React from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { usePublicPage } from "@/lib/useCms";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

export default function GoalsPage() {
  const { page } = usePublicPage("goals", {
    title: "Our Strategic Goals",
    subtitle: "Targeted, measurable milestones designed to create durable socio-economic dignity across communities.",
  });

  const defaultGoals = [
    {
      title: "Poverty Alleviation Through Qard Hasan",
      desc: "Provide interest-free revolving micro-finance to small roadside businesses, day laborers, and cottage artisans so they can escape predatory loan sharks.",
    },
    {
      title: "Universal Educational Continuity",
      desc: "Guarantee that no underprivileged child drops out of primary or secondary schooling due to unaffordable tuition fees, uniforms, or books.",
    },
    {
      title: "Catastrophic Healthcare Safety Net",
      desc: "Pool resources to provide direct subsidies and urgent medicine assistance to patients suffering from chronic ailments and acute emergencies.",
    },
    {
      title: "Transitioning Aid Recipients into Donors",
      desc: "Cultivate self-reliance such that beneficiaries of Qard Hasan graduate into stable earners and active monthly foundation contributors.",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-10 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-foundation-700">Strategic Roadmap</span>
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
                <div className="space-y-6">
                  {defaultGoals.map((g, idx) => (
                    <div key={idx} className="flex items-start gap-4 p-5 rounded-xl border border-slate-200 bg-slate-50/50">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foundation-100 text-foundation-800 font-bold text-sm shrink-0">
                        0{idx + 1}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">{g.title}</h3>
                        <p className="mt-1 text-sm text-slate-600 leading-relaxed">{g.desc}</p>
                      </div>
                    </div>
                  ))}
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
