import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  metadataBase: new URL("https://mockwebsite.example"),
  title: { default: "MockTest — Exam Preparation & Mock Tests", template: "%s | MockTest" },
  description: "A structured exam preparation platform with mock tests, practice, analytics and learning resources.",
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="container nav">
            <Link href="/" className="logo">MockTest</Link>
            <nav className="nav-links" aria-label="Primary navigation">
              <Link href="/exams">Exams</Link>
              <Link href="/tests">Mock Tests</Link>
              <Link href="/practice">Practice</Link>
              <Link href="/resources">Resources</Link>
              <Link href="/login">Login</Link>
            </nav>
          </div>
        </header>
        {children}
        <footer className="footer">
          <div className="container">© {new Date().getFullYear()} MockTest. Built for structured exam preparation.</div>
        </footer>
      </body>
    </html>
  );
}
