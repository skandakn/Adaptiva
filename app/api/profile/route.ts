import { requireApiUser, usesDemoStore } from "@/lib/api/auth";
import { demoStore } from "@/lib/api/demo-store";
import { fail, handleApiError, ok } from "@/lib/api/http";
import { profilePayloadSchema } from "@/lib/api/validation";

const defaultProfile = {
  reading_style: "Dyslexia-friendly",
  font_size: 18,
  line_spacing: 1.7,
  letter_spacing: 0.04,
  focus_mode: true,
  audio_enabled: true,
  audio_speed: 1,
  preferred_language: "English"
};

const defaultPreferences = {
  dyslexia_support: true,
  focus_support: true,
  audio_support: true,
  visual_support: true,
  language_support: false,
  step_by_step_support: true
};

export async function GET() {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;

  if (usesDemoStore(auth.mode)) {
    return ok({ mode: auth.mode, ...demoStore.getProfile() });
  }

  const [profileResult, preferencesResult] = await Promise.all([
    auth.supabase!.from("profiles").select("*").eq("user_id", auth.userId!).maybeSingle(),
    auth.supabase!.from("accessibility_preferences").select("*").eq("user_id", auth.userId!).maybeSingle()
  ]);

  if (profileResult.error || preferencesResult.error) {
    return fail("Could not load accessibility profile.", 500, "profile_load_failed");
  }

  let profile = profileResult.data;
  let preferences = preferencesResult.data;

  if (!profile) {
    const { data, error } = await auth.supabase!
      .from("profiles")
      .insert({ ...defaultProfile, user_id: auth.userId! })
      .select()
      .single();
    if (error) return fail("Could not create accessibility profile.", 500, "profile_create_failed");
    profile = data;
  }

  if (!preferences) {
    const { data, error } = await auth.supabase!
      .from("accessibility_preferences")
      .insert({ ...defaultPreferences, user_id: auth.userId! })
      .select()
      .single();
    if (error) return fail("Could not create accessibility preferences.", 500, "preferences_create_failed");
    preferences = data;
  }

  return ok({ mode: auth.mode, profile, preferences });
}

export async function PUT(request: Request) {
  try {
    const payload = profilePayloadSchema.parse(await request.json());
    const auth = await requireApiUser();
    if (auth.response) return auth.response;

    if (usesDemoStore(auth.mode)) {
      return ok({ mode: auth.mode, ...demoStore.saveProfile(payload) });
    }

    const { preferences, ...profilePayload } = payload;
    const [profileResult, preferencesResult] = await Promise.all([
      Object.keys(profilePayload).length
        ? auth.supabase!
            .from("profiles")
            .upsert({ ...defaultProfile, ...profilePayload, user_id: auth.userId! }, { onConflict: "user_id" })
            .select()
            .single()
        : auth.supabase!.from("profiles").select("*").eq("user_id", auth.userId!).single(),
      preferences
        ? auth.supabase!
            .from("accessibility_preferences")
            .upsert({ ...defaultPreferences, ...preferences, user_id: auth.userId! }, { onConflict: "user_id" })
            .select()
            .single()
        : auth.supabase!.from("accessibility_preferences").select("*").eq("user_id", auth.userId!).single()
    ]);

    if (profileResult.error || preferencesResult.error) {
      return fail("Could not save accessibility profile.", 500, "profile_save_failed");
    }

    return ok({
      mode: auth.mode,
      profile: profileResult.data,
      preferences: preferencesResult.data
    });
  } catch (error) {
    return handleApiError(error);
  }
}
