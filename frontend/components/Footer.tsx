"use client";

import React from "react";
import Link from "next/link";
import { HeartHandshake, MapPin, Phone, Mail, Globe } from "lucide-react";
import { useOrganization } from "@/lib/useCms";
import { useBranding } from "@/lib/branding";
import { FoundationLogo } from "./FoundationLogo";

export const Footer: React.FC = () => {
  const { name } = useBranding();
  const { org } = useOrganization({
    name: "Al-Birr Foundation",
    description:
      "Empowering communities through Islamic micro-finance, interest-free Qard Hasan loans, targeted Sadakah relief, and member contribution pooling under transparent group accounting.",
    address: "Level 4, House 12, Road 7, Dhanmondi, Dhaka 1205, Bangladesh",
    phone: "+880 1711-000000",
    email: "info@albirrfoundation.org",
    website: "https://albirrfoundation.org",
  });

  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <FoundationLogo size="md" />
              <span className="text-xl font-bold tracking-tight text-white">
                {name || org.name || "Foundation"}
              </span>
            </div>
            <p className="max-w-md text-sm text-slate-400 leading-relaxed">
              {org.description ||
                "Empowering communities through Islamic micro-finance, interest-free Qard Hasan loans, targeted Sadakah relief, and member contribution pooling under transparent group accounting."}
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-emerald-400 border border-slate-700">
                100% Shariah Compliant
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-slate-300 border border-slate-700">
                Interest Rate = 0%
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Quick Links</h4>
            <ul className="mt-4 space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/about" className="hover:text-emerald-400 transition-colors">
                  About Our Foundation
                </Link>
              </li>
              <li>
                <Link href="/goals" className="hover:text-emerald-400 transition-colors">
                  Our Strategic Goals
                </Link>
              </li>
              <li>
                <Link href="/mission" className="hover:text-emerald-400 transition-colors">
                  Vision & Mission
                </Link>
              </li>
              <li>
                <Link href="/activities" className="hover:text-emerald-400 transition-colors">
                  Activities & Relief
                </Link>
              </li>
              <li>
                <Link href="/apply" className="hover:text-emerald-400 transition-colors">
                  Apply for Membership
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Contact Info</h4>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{org.address || "Level 4, House 12, Road 7, Dhanmondi, Dhaka 1205, Bangladesh"}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{org.phone || "+880 1711-000000"}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{org.email || "info@albirrfoundation.org"}</span>
              </li>
              <li className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{org.website || "albirrfoundation.org"}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} {name || org.name || "Foundation"}. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-slate-400 transition-colors">
              Management Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
