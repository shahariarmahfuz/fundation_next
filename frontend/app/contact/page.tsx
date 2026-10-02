"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2 } from "lucide-react";
import { usePublicPage, useOrganization } from "@/lib/useCms";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const { page } = usePublicPage("contact", {
    title: "Contact Us",
    subtitle: "We welcome questions regarding our membership, group accounting model, Qard Hasan loans, and welfare programs.",
  });
  const { org } = useOrganization({
    name: "Al-Birr Foundation",
    address: "Level 4, House 12, Road 7, Dhanmondi, Dhaka 1205, Bangladesh",
    phone: "+880 1711-000000",
    email: "info@albirrfoundation.org",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-10 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-foundation-700">Get in Touch</span>
            <h1 className="mt-2 text-2xl sm:text-4xl font-extrabold text-slate-900">
              {page.title}
            </h1>
            {page.subtitle && (
              <p className="mt-3 text-base text-slate-600 leading-relaxed">
                {page.subtitle}
              </p>
            )}

            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Contact Info */}
              <div className="space-y-6">
                {page.content ? (
                  <MarkdownRenderer content={page.content} />
                ) : (
                  <>
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foundation-100 text-foundation-800 shrink-0">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">Head Office</h4>
                        <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                          {org.address || "Level 4, House 12, Road 7, Dhanmondi, Dhaka 1205, Bangladesh"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foundation-100 text-foundation-800 shrink-0">
                        <Phone className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">Phone Inquiries</h4>
                        <p className="mt-1 text-xs text-slate-600">{org.phone || "+880 1711-000000"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foundation-100 text-foundation-800 shrink-0">
                        <Mail className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">Email</h4>
                        <p className="mt-1 text-xs text-slate-600">{org.email || "info@albirrfoundation.org"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foundation-100 text-foundation-800 shrink-0">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">Visiting Hours</h4>
                        <p className="mt-1 text-xs text-slate-600">Saturday to Thursday: 9:00 AM – 5:00 PM</p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Inquiry Form */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6">
                {submitted ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto mb-3" />
                    <h3 className="font-bold text-slate-900 text-base">Message Sent Successfully</h3>
                    <p className="mt-2 text-xs text-slate-600">
                      Thank you for contacting us. A representative will respond to your inquiry shortly.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Your Name</label>
                      <input required type="text" className="input-field" placeholder="Enter your full name" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Email or Phone</label>
                      <input required type="text" className="input-field" placeholder="e.g. 01700000000 or email" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                      <input required type="text" className="input-field" placeholder="Membership / Donation / Qard inquiry" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Message</label>
                      <textarea required rows={4} className="input-field" placeholder="Write your message here..."></textarea>
                    </div>
                    <button type="submit" className="btn-primary w-full">
                      <Send className="h-4 w-4" />
                      Send Message
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
