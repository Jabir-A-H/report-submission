import type { Metadata, Viewport } from "next";
import { Inter, Tiro_Bangla } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { LanguageProvider } from "@/components/providers/language-provider";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

const tiroBangla = Tiro_Bangla({
  weight: "400",
  subsets: ["bengali"],
  variable: "--font-tiro-bangla",
});

export const metadata: Metadata = {
  title: "রিপোর্ট সাবমিশন সিস্টেম",
  description: "Modern, high-fidelity report submission and management system.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { Navbar } from "@/components/layout/navbar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { ReportProvider } from "@/components/report/report-context";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={`${inter.variable} ${tiroBangla.variable} antialiased font-sans flex flex-col min-h-screen overscroll-none`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="solarized-light"
          enableSystem
          disableTransitionOnChange
          themes={["light", "dark", "solarized-light", "solarized-dark"]}
        >
          <LanguageProvider>
            <ReportProvider>
              <Navbar />
              <main className="flex-1 flex flex-col relative z-0 pb-20 md:pb-0">
                {children}
              </main>
              <BottomNav />
            </ReportProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
