"use client";

import React from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Compass, Eye, Heart, Shield, Scale } from "lucide-react";
import { usePublicPage } from "@/lib/useCms";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

export default function MissionPage() {
  const { page } = usePublicPage("mission", {
    title: "Our Vision & Mission",
    subtitle: "Guided by faith, driven by compassion, governed by transparency",
  });

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-10 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-foundation-700">Philosophy</span>
            <h1 className="mt-2 text-2xl sm:text-4xl font-extrabold text-slate-900">
              {page.title}
            </h1>
            {page.subtitle && (
              <p className="mt-3 text-base text-slate-600 leading-relaxed">
                {page.subtitle}
              </p>
            )}

            <div className="mt-8 border-t border-slate-100 pt-8">
              {page.content ? (
                <MarkdownRenderer content={page.content} />
              ) : (
                <div className="space-y-8">
                  <div className="p-6 rounded-xl bg-foundation-50/60 border border-foundation-200/60">
                    <div className="flex items-center gap-2.5 text-foundation-800 font-bold text-lg">
                      <Eye className="h-5 w-5" />
                      <span>Our Vision</span>
                    </div>
                    <p className="mt-2 text-sm sm:text-base text-slate-700 leading-relaxed">
                      A society free from exploitative, interest-bearing debt, where every vulnerable individual
                      has access to compassionate, interest-free capital and emergency mutual support with complete human dignity.
                    </p>
                  </div>

                  <div className="p-6 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-2.5 text-slate-900 font-bold text-lg">
                      <Compass className="h-5 w-5 text-emerald-600" />
                      <span>Our Mission</span>
                    </div>
                    <p className="mt-2 text-sm sm:text-base text-slate-700 leading-relaxed">
                      To mobilize conscientious citizens through organized monthly contributions, administering
                      funds through transparent, group-based accounting, and deploying capital exclusively for
                      Shariah-compliant social good, 0% interest loans, and non-repayable humanitarian aid.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Our Foundational Values</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="border border-slate-200 p-4 rounded-xl bg-white">
                        <Shield className="h-5 w-5 text-emerald-600 mb-2" />
                        <h4 className="font-bold text-slate-900 text-sm">Amanah (Trust)</h4>
                        <p className="mt-1 text-xs text-slate-600">Absolute fiduciary integrity and transparent record-keeping.</p>
                      </div>
                      <div className="border border-slate-200 p-4 rounded-xl bg-white">
                        <Heart className="h-5 w-5 text-rose-600 mb-2" />
                        <h4 className="font-bold text-slate-900 text-sm">Ihsan (Excellence)</h4>
                        <p className="mt-1 text-xs text-slate-600">Treating every beneficiary with empathy, respect, and confidentiality.</p>
                      </div>
                      <div className="border border-slate-200 p-4 rounded-xl bg-white">
                        <Scale className="h-5 w-5 text-blue-600 mb-2" />
                        <h4 className="font-bold text-slate-900 text-sm">Adl (Justice)</h4>
                        <p className="mt-1 text-xs text-slate-600">Fair, interest-free terms without hidden fees or predatory enforcement.</p>
                      </div>
                    </div>
                  </div>
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
