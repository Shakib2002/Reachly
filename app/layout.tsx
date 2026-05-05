import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://reachly.app"),
  title: { default: "Reachly — Find. Track. Close.", template: "%s | Reachly" },
  description: "All-in-one platform for job seekers and freelancers. Search jobs, manage leads, send AI-powered emails, and track analytics.",
  keywords: ["job search", "lead management", "CRM", "email outreach", "analytics", "SaaS", "AI emails"],
  other: { "mobile-web-app-capable": "yes", "apple-mobile-web-app-status-bar-style": "default" },
  openGraph: {
    title: "Reachly — Find. Track. Close.",
    description: "All-in-one platform for job seekers and freelancers.",
    url: "https://reachly.app",
    siteName: "Reachly",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Reachly — Find. Track. Close.",
    description: "All-in-one platform for job seekers and freelancers.",
  },
  robots: { index: true, follow: true },
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
