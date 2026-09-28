import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import PrimaryNav from "@/components/primary-nav";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "MockTest — Exam Preparation & Mock Tests", template: "%s | MockTest" },
  description: "A structured exam preparation platform with mock tests, practice, analytics and learning resources.",
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={plusJakarta.variable}>
        <header className="site-header">
          <div className="container nav">
            <Link href="/" className="logo" aria-label="MockTest home">
              <span className="logo-mark">M</span><span>MockTest</span>
            </Link>
            <PrimaryNav />
          </div>
        </header>
        {children}
        <footer className="footer">
          <div className="container footer-inner">
            <div><strong>MockTest</strong><span>Focused practice. Clear performance insights.</span></div>
            <div className="footer-links"><Link href="/tests">Mock Tests</Link><Link href="/dashboard">Dashboard</Link><Link href="/resources">Resources</Link></div>
          </div>
        </footer>
      </body>
    </html>
  );
}
