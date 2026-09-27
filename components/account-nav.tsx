"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type UserState = { email: string; label: string; initial: string } | null;

export default function AccountNav() {
  const [user, setUser] = useState<UserState>(null);
  const [ready, setReady] = useState(true);

  useEffect(() => {
    let mounted = true;
    let supabase: ReturnType<typeof createSupabaseBrowserClient>;

    try {
      supabase = createSupabaseBrowserClient();
    } catch {
      return () => { mounted = false; };
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const email = data.user?.email ?? "";
      const metadataName = typeof data.user?.user_metadata?.display_name === "string"
        ? data.user.user_metadata.display_name.trim()
        : "";
      const label = metadataName || email.split("@")[0] || "Account";
      setUser(data.user ? { email, label, initial: label.charAt(0).toUpperCase() } : null);
      setReady(true);
    }).catch(() => {
      if (mounted) setReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const email = session?.user?.email ?? "";
      const metadataName = typeof session?.user?.user_metadata?.display_name === "string"
        ? session.user.user_metadata.display_name.trim()
        : "";
      const label = metadataName || email.split("@")[0] || "Account";
      setUser(session?.user ? { email, label, initial: label.charAt(0).toUpperCase() } : null);
      setReady(true);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (!ready) return <Link href="/login" className="nav-cta nav-cta-loading" aria-label="Account">Sign in</Link>;

  if (!user) return <Link href="/login" className="nav-cta">Sign in</Link>;

  return (
    <details className="account-menu">
      <summary className="account-chip" aria-label="Open account menu">
        <span className="account-avatar">{user.initial}</span>
        <span className="account-name">{user.label}</span>
        <span className="account-chevron" aria-hidden="true">⌄</span>
      </summary>
      <div className="account-dropdown">
        <div className="account-dropdown-head">
          <span className="account-avatar account-avatar-small">{user.initial}</span>
          <div><strong>{user.label}</strong><small>{user.email}</small></div>
        </div>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/profile">My profile</Link>
        <Link href="/dashboard/history">Test history</Link>
        <Link href="/dashboard/analytics">Analytics</Link>
        <div className="account-divider" />
        <button
          className="account-logout"
          type="button"
          onClick={async () => {
            const supabase = createSupabaseBrowserClient();
            await supabase.auth.signOut();
            window.location.href = "/login?message=logged-out";
          }}
        >
          Log out
        </button>
      </div>
    </details>
  );
}
