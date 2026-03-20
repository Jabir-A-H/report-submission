import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CommandBar } from "@/components/layout/command-bar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Report Submission | Premium Dashboard",
  description: "Modern, high-fidelity report submission and management system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn">
      <body className={`${inter.className} antialiased font-sans flex flex-col min-h-screen overscroll-none`}>
        <CommandBar>
          <main className="flex-1 flex flex-col relative z-0">
            {children}
          </main>
        </CommandBar>
      </body>
    </html>
  );
}
