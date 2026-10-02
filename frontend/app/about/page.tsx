"use client";

import React from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ShieldCheck, HeartHandshake } from "lucide-react";
import { usePublicPage } from "@/lib/useCms";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

export default function AboutPage() {
  const { page } = usePublicPage("about", {
    title: "About Our Foundation",
    subtitle:
      "A community-driven philanthropic movement founded on collective responsibility, Shariah integrity, and double-entry accounting transparency.",
  });

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-10 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-foundation-700">About Us</span>
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
                <div className="space-y-6 text-sm sm:text-base text-slate-700 leading-relaxed">
                  <h3 className="text-lg font-bold text-slate-900">Who We Are</h3>
                  <p>
                    Established with the mission to eliminate usurious micro-loans and empower vulnerable families,
                    our Foundation operates on a unique <strong>Group-based accounting architecture</strong>.
                    Unlike traditional non-profits where donations disappear into a central untraceable pool, our
                    members belong to dedicated accounting groups (such as General, Education, Medical, and Emergency Relief).
                  </p>

                  <h3 className="text-lg font-bold text-slate-900">Our Governing Principles</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
                    <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
                      <div className="flex items-center gap-2 font-bold text-slate-900">
                        <ShieldCheck className="h-5 w-5 text-emerald-600" />
                        <span>Amanah (Trust)</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-600">
                        Every Taka collected is recorded in an immutable ledger with full traceability.
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
                      <div className="flex items-center gap-2 font-bold text-slate-900">
                        <HeartHandshake className="h-5 w-5 text-emerald-600" />
                        <span>Interest-Free (Qard Hasan)</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-600">
                        Zero interest, zero processing fees, zero penalty charges. True Islamic brotherly lending.
                      </p>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">Leadership & Advisory Board</h3>
                  <p>
                    Our foundation is guided by an advisory council of Islamic finance scholars, certified public
                    accountants, and respected local community leaders who ensure rigorous Shariah compliance
                    and operational excellence at every stage.
                  </p>
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
