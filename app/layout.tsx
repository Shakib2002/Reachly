import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Reachly — Find. Track. Close.",
  description:
    "All-in-One Job & Lead Management SaaS. Combines Job Search, Lead CRM, Email Outreach, and Analytics in one powerful platform.",
  keywords: [
    "job search",
    "lead management",
    "CRM",
    "email outreach",
    "analytics",
    "SaaS",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
