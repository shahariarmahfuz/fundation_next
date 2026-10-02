"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { usePublicPage, useOrganization } from "@/lib/useCms";
import {
  HeartHandshake,
  Scale,
  Heart,
  FolderTree,
  Users,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Coins,
  BookOpen
} from "lucide-react";

export default function HomePage() {
  const { page } = usePublicPage("home", {
    title: "Empowering Communities with Dignity, Mutual Aid & Zero Usury",
    subtitle:
      "Al-Birr Foundation operates an accountable group-accounting system. Members pool monthly contributions into designated financial groups to provide interest-free Qard Hasan loans, targeted Sadakah relief, and healthcare subsidies.",
  });
  const { org } = useOrganization({
    name: "Al-Birr Foundation",
    tagline: "Empowering Communities Through Islamic Finance, Qard Hasan & Charity",
  });

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-foundation-900 via-foundation-950 to-slate-950 py-20 sm:py-28 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(34,197,94,0.25),rgba(255,255,255,0))]"></div>
          
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-foundation-500/30 bg-foundation-500/10 px-4 py-1.5 text-xs sm:text-sm font-semibold text-foundation-300 mb-6 backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              <span>{org.tagline || "Interest-Free Islamic Community Finance"}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight">
              {page.title.includes("Zero Usury") ? (
                <>
                  {page.title.replace("Zero Usury", "")}
                  <span className="text-foundation-400">Zero Usury</span>
                </>
              ) : (
                page.title
              )}
            </h1>

            <p className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed">
              {page.subtitle}
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/apply"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-foundation-500 px-6 py-3.5 text-sm sm:text-base font-bold text-slate-950 shadow-lg shadow-foundation-500/25 hover:bg-foundation-400 transition-all"
              >
                Become a Member
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/about"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/60 px-6 py-3.5 text-sm sm:text-base font-semibold text-white hover:bg-slate-800 transition-all backdrop-blur-sm"
              >
                Learn About Our Model
              </Link>
            </div>

            {/* Badges */}
            <div className="mt-14 pt-8 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-foundation-400 shrink-0" />
                <span className="text-xs sm:text-sm text-slate-300 font-medium">Interest = Strictly 0%</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-foundation-400 shrink-0" />
                <span className="text-xs sm:text-sm text-slate-300 font-medium">Group-Based Accounting</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-foundation-400 shrink-0" />
                <span className="text-xs sm:text-sm text-slate-300 font-medium">Audited & Traceable</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-foundation-400 shrink-0" />
                <span className="text-xs sm:text-sm text-slate-300 font-medium">Shariah Compliant</span>
              </div>
            </div>
          </div>
        </section>

        {/* Core Pillars */}
        <section className="py-16 sm:py-24 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-foundation-700">
                Our Financial Architecture
              </h2>
              <p className="mt-2 text-2xl sm:text-4xl font-extrabold text-slate-900">
                Transparent Group Stewardship
              </p>
              <p className="mt-4 text-sm sm:text-base text-slate-600">
                Every member belongs to an accounting group. Funds never commingle ambiguously; each
                financial group maintains its independent balance, income, expenses, and ledger.
              </p>
            </div>

            <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1 */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-8 hover:shadow-lg transition-all border-t-4 border-t-emerald-600">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 mb-6">
                  <Coins className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Member Contributions</h3>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                  Every active member contributes monthly (e.g. ৳500/month). Contributions flow directly
                  into the member's assigned accounting group, raising the group balance and generating
                  an immutable journal record.
                </p>
                <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Member → Group Account Balance</span>
                </div>
              </div>

              {/* Card 2 */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-8 hover:shadow-lg transition-all border-t-4 border-t-blue-600">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700 mb-6">
                  <Scale className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Qard Hasan (Zero Interest)</h3>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                  Small business owners, rickshaw pullers, and struggling families receive interest-free
                  loans. Money leaves the group as an outstanding receivable. Every repaid installment
                  returns to the group account.
                </p>
                <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-blue-700">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>0% Interest • Revolving Capital</span>
                </div>
              </div>

              {/* Card 3 */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-8 hover:shadow-lg transition-all border-t-4 border-t-rose-600">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-700 mb-6">
                  <Heart className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Sadakah & Medical Aid</h3>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                  Non-repayable direct cash assistance for acute emergencies, catastrophic illness,
                  prescriptions, and student tuition for orphans and the ultra-poor.
                </p>
                <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-rose-700">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Pure Relief • No Repayment</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Flow */}
        <section className="py-16 sm:py-20 bg-slate-100/60 border-y border-slate-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-foundation-700">
                The Financial Journey
              </h2>
              <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">
                How Our System Handles Every Taka
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative">
                <span className="text-3xl font-extrabold text-foundation-200 mb-2 block">01</span>
                <h4 className="font-bold text-slate-900">Join a Group</h4>
                <p className="mt-2 text-xs text-slate-600">
                  Apply online. Upon approval, management assigns you to an accounting group (e.g. Education, Medical, or General).
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative">
                <span className="text-3xl font-extrabold text-foundation-200 mb-2 block">02</span>
                <h4 className="font-bold text-slate-900">Monthly Contribution</h4>
                <p className="mt-2 text-xs text-slate-600">
                  Pay your modest monthly dues. The transaction credits your designated group account balance immediately.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative">
                <span className="text-3xl font-extrabold text-foundation-200 mb-2 block">03</span>
                <h4 className="font-bold text-slate-900">Program Execution</h4>
                <p className="mt-2 text-xs text-slate-600">
                  Funds disburse for Qard Hasan loans, Sadakah aid, or verified program expenses with zero leakage.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative">
                <span className="text-3xl font-extrabold text-foundation-200 mb-2 block">04</span>
                <h4 className="font-bold text-slate-900">Continuous Auditing</h4>
                <p className="mt-2 text-xs text-slate-600">
                  Real-time ledgers track running balances. Loan repayments return to the group, renewing funds for future recipients.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 sm:py-20 bg-foundation-800 text-white text-center">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-4xl font-extrabold">Ready to Join Our Community of Givers?</h2>
            <p className="mt-4 text-foundation-100 text-sm sm:text-base max-w-xl mx-auto">
              Submit your membership application online. Our management board reviews submissions and assigns each member to an active welfare group.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link
                href="/apply"
                className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-foundation-900 shadow-md hover:bg-foundation-50 transition-colors"
              >
                Apply for Membership
              </Link>
              <Link
                href="/contact"
                className="rounded-xl border border-foundation-600 px-6 py-3 text-sm font-semibold text-white hover:bg-foundation-700 transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
