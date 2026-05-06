import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import HeaderTitle from "@/components/HeaderTitle";
import NotificationBell from "@/components/NotificationBell";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Ask CA — Regulatory Intelligence",
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
        <div className="app">
          <Sidebar />
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
      </body>
    </html>
  );
}
