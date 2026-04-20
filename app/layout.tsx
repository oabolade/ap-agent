import type { Metadata } from "next";
import "./globals.css";
import NavHeader from "@/components/shared/NavHeader";

export const metadata: Metadata = {
  title: "AutoAP — Autonomous Accounts Payable Agent",
  description: "Real-time command center for autonomous invoice processing. Replace 8 hours/week of manual AP work.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=JetBrains+Mono:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <NavHeader />
        <main style={{ minHeight: 'calc(100vh - 52px)' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
