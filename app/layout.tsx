import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logout } from "@/app/login/actions";
import ThemeToggle from "@/components/theme-toggle";

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

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const displayName = typeof user?.user_metadata?.display_name === "string" ? user.user_metadata.display_name.trim() : "";
  const accountLabel = displayName || user?.email?.split("@")[0] || "Account";
  const initial = accountLabel.charAt(0).toUpperCase();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={plusJakarta.variable}>
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
              <ThemeToggle />
              {user ? (
                <details className="account-menu">
                  <summary className="account-chip" aria-label="Open account menu">
                    <span className="account-avatar">{initial}</span>
                    <span className="account-name">{accountLabel}</span>
                    <span className="account-chevron" aria-hidden="true">⌄</span>
                  </summary>
                  <div className="account-dropdown">
                    <div className="account-dropdown-head">
                      <span className="account-avatar account-avatar-small">{initial}</span>
                      <div><strong>{accountLabel}</strong><small>{user.email}</small></div>
                    </div>
                    <Link href="/dashboard">Dashboard</Link>
                    <Link href="/profile">My profile</Link>
                    <Link href="/dashboard/history">Test history</Link>
                    <Link href="/dashboard/analytics">Analytics</Link>
                    <div className="account-divider" />
                    <form action={logout}>
                      <button className="account-logout" type="submit">Log out</button>
                    </form>
                  </div>
                </details>
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
