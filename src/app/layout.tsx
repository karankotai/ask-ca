import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SidebarShell from "@/components/SidebarShell";
import HeaderTitle from "@/components/HeaderTitle";
import NotificationBell from "@/components/NotificationBell";
import { SessionProvider } from "@/components/SessionProvider";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "RegMitra — Regulatory Intelligence",
  description: "Multi-act compliance and circular impact analysis for CA firms",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <div className="app">
          <SidebarShell />
          <main className="main">
              <header className="header">
                <HeaderTitle />
                <div className="header-actions">
                  <NotificationBell />
                </div>
              </header>
              <div className="content">{children}</div>
            </main>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}

