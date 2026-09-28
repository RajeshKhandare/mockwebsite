"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const allowedLanguages = new Set(["en", "hi", "mr"]);

export async function updateProfile(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/profile");

  const displayName = String(formData.get("display_name") ?? "").trim().slice(0, 80);
  const targetExam = String(formData.get("target_exam") ?? "").trim().slice(0, 120);
  const educationLevel = String(formData.get("education_level") ?? "").trim().slice(0, 80);
  const state = String(formData.get("state") ?? "").trim().slice(0, 80);
  const preparationStage = String(formData.get("preparation_stage") ?? "").trim().slice(0, 80);
  const preferredLanguage = String(formData.get("preferred_language") ?? "en").trim();

  if (!displayName) redirect("/profile?error=name");
  if (!allowedLanguages.has(preferredLanguage)) redirect("/profile?error=language");

  const profilePayload = {
    id: user.id,
    display_name: displayName,
    target_exam: targetExam || null,
    education_level: educationLevel || null,
    state: state || null,
    preparation_stage: preparationStage || null,
    preferred_language: preferredLanguage,
    updated_at: new Date().toISOString(),
  };

  // Most accounts already have a profile row, so keep normal edits inside the
  // user's RLS scope. New/legacy accounts can be backfilled with the server-only
  // client after the caller has been authenticated above.
  const { data: updatedProfile, error: updateError } = await supabase
    .from("profiles")
    .update(profilePayload)
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (updateError) redirect("/profile?error=save");

  if (!updatedProfile) {
    // Prefer a normal authenticated insert when the profile row was never
    // created (for example, an account created before the profile trigger).
    const { data: insertedProfile, error: insertError } = await supabase
      .from("profiles")
      .insert(profilePayload)
      .select("id")
      .maybeSingle();

    if (!insertedProfile && insertError) {
      try {
        const admin = createSupabaseAdminClient();
        const { error: adminInsertError } = await admin.from("profiles").upsert(profilePayload, { onConflict: "id" });
        if (adminInsertError) redirect("/profile?error=save");
      } catch {
        redirect("/profile?error=save");
      }
    }
  }

  const { error: authError } = await supabase.auth.updateUser({ data: { display_name: displayName } });
  if (authError) redirect("/profile?error=save");

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/history");
  revalidatePath("/dashboard/analytics");
  redirect("/profile?saved=1");
}
