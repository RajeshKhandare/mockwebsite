"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function safeNextPath(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "/dashboard";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

function authRedirect(path: string, error: string) {
  return redirect(path + (path.includes("?") ? "&" : "?") + "error=" + error);
}

async function claimGuestAttempts(userId: string) {
  const cookieStore = await cookies();
  const guestToken = cookieStore.get("mock_guest")?.value;
  if (!guestToken) return;
  const admin = createSupabaseAdminClient();
  await admin.from("test_attempts")
    .update({ user_id: userId, guest_token: null })
    .eq("guest_token", guestToken)
    .is("user_id", null);
  cookieStore.set("mock_guest", "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(formData.get("next"));
  if (!email || !password) redirect("/login?error=missing");

  const supabase = await createSupabaseServerClient();
  const { data: loginData, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const inline = formData.get("inline") === "1";
    if (inline && next !== "/dashboard") authRedirect(next, "invalid");
    redirect("/login?error=invalid");
  }

  if (loginData.user) await claimGuestAttempts(loginData.user.id);
  revalidatePath("/", "layout");
  redirect(next);
}

export async function signup(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("display_name") ?? "").trim();
  const targetExam = String(formData.get("target_exam") ?? "").trim();
  const educationLevel = String(formData.get("education_level") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const preparationStage = String(formData.get("preparation_stage") ?? "").trim();
  const preferredLanguage = String(formData.get("preferred_language") ?? "").trim();
  const inline = formData.get("inline") === "1";
  const next = safeNextPath(formData.get("next"));
  if (!email || password.length < 8) {
    if (inline && next !== "/dashboard") authRedirect(next, "signup");
    redirect("/login?error=signup");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName || undefined } },
  });
  if (error) {
    if (inline && next !== "/dashboard") authRedirect(next, "signup");
    redirect("/login?error=signup");
  }

  if (data.user) {
    const admin = createSupabaseAdminClient();
    await admin.from("profiles").upsert({
      id: data.user.id,
      display_name: displayName || null,
      target_exam: targetExam || null,
      education_level: educationLevel || null,
      state: state || null,
      preparation_stage: preparationStage || null,
      preferred_language: preferredLanguage || null,
    }, { onConflict: "id" });
  }

  const signedInUserId = data.user?.id;
  if (data.session && signedInUserId) {
    await claimGuestAttempts(signedInUserId);
    revalidatePath("/", "layout");
    redirect(inline ? next : "/dashboard");
  }
  if (inline && next !== "/dashboard") redirect(next + (next.includes("?") ? "&" : "?") + "message=check-email");
  redirect("/login?message=check-email");
}

export async function logout() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
