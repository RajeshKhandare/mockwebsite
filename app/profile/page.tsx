import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import ProfileEditor from "./profile-editor";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My Profile | MockTest", robots: { index: false, follow: false } };

export default async function ProfilePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const search = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <main className="page-shell narrow-shell"><section className="auth-card">
      <p className="eyebrow">My profile</p><h1>Sign in required</h1>
      <p className="muted">Sign in to view your student profile.</p>
      <Link className="button primary" href="/login?next=/profile">Go to login</Link>
    </section></main>;
  }

  const [{ data: profile }, { data: stats }] = await Promise.all([
    supabase.from("profiles").select("display_name,target_exam,education_level,state,preparation_stage,preferred_language").eq("id", user.id).maybeSingle(),
    supabase.from("performance_stats").select("attempts_count,completed_count,average_accuracy,average_score").eq("user_id", user.id).maybeSingle(),
  ]);
  const name = profile?.display_name || user.email?.split("@")[0] || "Student";
  const publicSupabase = createSupabasePublicClient();
  const { data: exams } = await publicSupabase.from("exams").select("name").eq("is_active", true).order("name");

  return (
    <main className="page-shell profile-page">
      <section className="profile-cover">
        <div className="profile-identity">
          <div className="profile-avatar large">{name.charAt(0).toUpperCase()}</div>
          <div>
            <p className="eyebrow">My profile</p>
            <h1>{name}</h1>
            <p className="profile-email">{user.email}</p>
          </div>
        </div>
        <Link className="button" href="/dashboard">Back to dashboard</Link>
      </section>

      <div className="dashboard-nav profile-page-nav">
        <Link href="/dashboard">Overview</Link>
        <Link href="/dashboard/history">Test history</Link>
        <Link href="/dashboard/analytics">Analytics</Link>
        <Link className="active" href="/profile">Profile</Link>
      </div>

      <div className="profile-grid">
        <ProfileEditor
          initial={{
            displayName: name,
            email: user.email ?? "",
            targetExam: profile?.target_exam ?? "",
            educationLevel: profile?.education_level ?? "",
            state: profile?.state ?? "",
            preparationStage: profile?.preparation_stage ?? "",
            preferredLanguage: profile?.preferred_language ?? "en",
          }}
          exams={(exams ?? []).map((exam) => exam.name)}
          error={typeof search.error === "string" ? search.error : undefined}
          saved={search.saved === "1"}
        />

        <section className="panel profile-numbers-panel">
          <p className="eyebrow">Your numbers</p>
          <h2>Performance snapshot</h2>
          <div className="profile-number-list">
            <div><strong>{stats?.attempts_count ?? 0}</strong><span>Total attempts</span></div>
            <div><strong>{stats?.completed_count ?? 0}</strong><span>Completed</span></div>
            <div><strong>{Number(stats?.average_accuracy ?? 0).toFixed(1)}%</strong><span>Average accuracy</span></div>
            <div><strong>{Number(stats?.average_score ?? 0).toFixed(1)}</strong><span>Average score</span></div>
          </div>
          <Link className="button primary" href="/dashboard/analytics">Open full analytics</Link>
        </section>
      </div>
    </main>
  );
}
