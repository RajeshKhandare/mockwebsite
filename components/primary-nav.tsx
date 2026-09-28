"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/theme-toggle";
import AccountNav from "@/components/account-nav";

const links = [
  ["/exams", "Exams"],
  ["/tests", "Mock Tests"],
  ["/practice", "Practice"],
  ["/resources", "Resources"],
] as const;

export default function PrimaryNav() {
  const pathname = usePathname();

  return (
    <nav className="nav-links" aria-label="Primary navigation">
      {links.map(([href, label]) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link href={href} className={active ? "active" : undefined} aria-current={active ? "page" : undefined} key={href}>
            {label}
          </Link>
        );
      })}
      <ThemeToggle />
      <AccountNav />
    </nav>
  );
}
