import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logout } from "@/app/login/actions";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "MockTest — Exam Preparation & Mock Tests", template: "%s | MockTest" },
  description: "A structured exam preparation platform with mock tests, practice, analytics and learning resources.",
  robots: { index: true, follow: true },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const displayName = typeof user?.user_metadata?.display_name === "string" ? user.user_metadata.display_name.trim() : "";
  const accountLabel = displayName || user?.email?.split("@")[0] || "Account";
  const initial = accountLabel.charAt(0).toUpperCase();

  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="container nav">
            <Link href="/" className="logo" aria-label="MockTest home">
              <span className="logo-mark">M</span><span>MockTest</span>
            </Link>
            <nav className="nav-links" aria-label="Primary navigation">
              <Link href="/exams">Exams</Link>
              <Link href="/tests">Mock Tests</Link>
              <Link href="/practice">Practice</Link>
              <Link href="/resources">Resources</Link>
              {user ? (
                <div className="account-nav">
                  <Link href="/dashboard" className="account-chip" aria-label="Open your dashboard">
                    <span className="account-avatar">{initial}</span>
                    <span className="account-name">{accountLabel}</span>
                  </Link>
                  <form action={logout}>
                    <button className="nav-logout" type="submit">Log out</button>
                  </form>
                </div>
              ) : (
                <Link href="/login" className="nav-cta">Sign in</Link>
              )}
            </nav>
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
