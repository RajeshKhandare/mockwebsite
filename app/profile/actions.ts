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

  let profileSaved = false;

  const { data: updatedProfile, error: updateError } = await supabase
    .from("profiles")
    .update(profilePayload)
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (!updateError && updatedProfile) {
    profileSaved = true;
  } else {
    const { data: insertedProfile, error: insertError } = await supabase
      .from("profiles")
      .insert(profilePayload)
      .select("id")
      .maybeSingle();

    if (!insertError && insertedProfile) {
      profileSaved = true;
    } else {
      // The caller is already authenticated. Use the server-only admin client
      // as a final fallback for legacy accounts or an RLS/session edge case.
      try {
        const admin = createSupabaseAdminClient();
        const { error: adminError } = await admin
          .from("profiles")
          .upsert(profilePayload, { onConflict: "id" });
        profileSaved = !adminError;
      } catch {
        profileSaved = false;
      }
    }
  }

  if (!profileSaved) redirect("/profile?error=save");

  // The profile row is the source of truth for the editor. Keep auth metadata
  // synchronized when possible, but do not turn a successful profile save into
  // a failure if Supabase Auth rejects a metadata update.
  await supabase.auth.updateUser({ data: { display_name: displayName } });

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/history");
  revalidatePath("/dashboard/analytics");
  redirect("/profile?saved=1");
}
