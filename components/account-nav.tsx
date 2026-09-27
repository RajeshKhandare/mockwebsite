"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type UserState = { email: string; label: string; initial: string } | null;

function toUserState(user: { email?: string; user_metadata?: Record<string, unknown> } | null): UserState {
  if (!user) return null;
  const email = user.email ?? "";
  const metadataName = typeof user.user_metadata?.display_name === "string"
    ? user.user_metadata.display_name.trim()
    : "";
  const label = metadataName || email.split("@")[0] || "Account";
  return { email, label, initial: label.charAt(0).toUpperCase() };
}

export default function AccountNav() {
  const router = useRouter();
  const [user, setUser] = useState<UserState>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    const supabase = createSupabaseBrowserClient();

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUser(toUserState(data.user));
      setReady(true);
    }).catch(() => {
      if (mounted) setReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(toUserState(session?.user ?? null));
      setReady(true);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (!ready && !user) {
    return <span className="nav-cta nav-cta-loading" aria-hidden="true">Account</span>;
  }

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
            try {
              const supabase = createSupabaseBrowserClient();
              await supabase.auth.signOut();
            } finally {
              router.push("/login?message=logged-out");
            }
          }}
        >
          Log out
        </button>
      </div>
    </details>
  );
}
