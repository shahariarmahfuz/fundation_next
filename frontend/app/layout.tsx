import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme";
import { BrandingProvider } from "@/lib/branding";
import { FlashProvider } from "@/lib/flash";

export const metadata: Metadata = {
  title: {
    template: "%s | Al-Birr Foundation",
    default: "Al-Birr Foundation — Ethical Group Accounting & Social Welfare",
  },
  description: "Comprehensive foundation management, interest-free Qard Hasan micro-finance, Sadakah relief, and group-based double-entry accounting.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans dark:bg-[#050505] dark:text-[#F5F5F5] transition-colors duration-200">
        <ThemeProvider>
          <BrandingProvider>
            <FlashProvider>
              {children}
            </FlashProvider>
          </BrandingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
