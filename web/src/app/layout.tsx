import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TQ Report Submission",
  description: "Modern Report Submission System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
