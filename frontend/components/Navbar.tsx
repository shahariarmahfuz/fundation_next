"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, HeartHandshake, ShieldCheck, UserPlus, ArrowRight } from "lucide-react";
import { useBranding } from "@/lib/branding";
import { FoundationLogo } from "./FoundationLogo";

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { name, tagline } = useBranding();

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "About Us", href: "/about" },
    { name: "Goals", href: "/goals" },
    { name: "Activities", href: "/activities" },
    { name: "Track Status", href: "/apply/status" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16 sm:h-20">
        <Link href="/" className="flex items-center gap-2.5 min-w-0">
          <FoundationLogo size="lg" />
          <div className="flex flex-col min-w-0">
            <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 leading-tight truncate">
              {name || "Foundation"}
            </span>
            <span className="text-[10px] sm:text-xs text-foundation-700 font-medium tracking-wide uppercase line-clamp-1">
              {tagline || "Ethical Group Finance & Charity"}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-foundation-50 text-foundation-800 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/apply"
            className="inline-flex items-center gap-1.5 rounded-lg border border-foundation-600 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-foundation-700 shadow-sm hover:bg-foundation-50 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            Apply for Membership
          </Link>
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-1.5 rounded-lg bg-foundation-700 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-foundation-800 transition-colors"
          >
            <ShieldCheck className="h-4 w-4" />
            Management Panel
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/apply"
            className="rounded-lg bg-foundation-700 px-3 py-1.5 text-xs font-semibold text-white"
          >
            Apply
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-2 shadow-xl">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block rounded-lg px-3 py-2 text-base font-medium ${
                pathname === link.href
                  ? "bg-foundation-50 text-foundation-800 font-bold"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
            <Link
              href="/apply"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 rounded-lg border border-foundation-600 px-4 py-2.5 text-sm font-semibold text-foundation-700"
            >
              <UserPlus className="h-4 w-4" />
              Member Application
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
            >
              <ShieldCheck className="h-4 w-4" />
              Staff Login
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
