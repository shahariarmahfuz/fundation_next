import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Al-Birr Foundation — Ethical Group Accounting & Social Welfare",
  description: "Comprehensive foundation management, interest-free Qard Hasan micro-finance, Sadakah relief, and group-based double-entry accounting.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
