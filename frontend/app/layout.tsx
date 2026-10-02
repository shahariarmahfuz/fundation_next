import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme";

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
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
