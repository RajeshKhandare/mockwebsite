"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    display_name: displayName,
    target_exam: targetExam || null,
    education_level: educationLevel || null,
    state: state || null,
    preparation_stage: preparationStage || null,
    preferred_language: preferredLanguage,
    updated_at: new Date().toISOString(),
  }, { onConflict: "id" });

  if (error) redirect("/profile?error=save");

  await supabase.auth.updateUser({ data: { display_name: displayName } });

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/history");
  revalidatePath("/dashboard/analytics");
  redirect("/profile?saved=1");
}
