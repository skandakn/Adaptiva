import { featuredLesson } from "@/lib/demo-data";
import { requireApiUser, usesDemoStore } from "@/lib/api/auth";
import { demoStore } from "@/lib/api/demo-store";
import { fail, ok } from "@/lib/api/http";

export async function GET() {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;

  if (usesDemoStore(auth.mode)) {
    const { profile, preferences } = demoStore.getProfile();
    const materials = demoStore.listMaterials();
    const summary = demoStore.getProgressSummary();
    return ok({
      mode: auth.mode,
      profile,
      preferences,
      materials,
      stats: {
        learning_streak: "1 day",
        focus_sessions: summary.sessions.filter((session) => session.mode.toLowerCase().includes("focus")).length,
        concepts_understood: summary.progress.filter(
          (item) => item.status === "understood" || item.status === "mastered"
        ).length,
        materials_completed: summary.sessions.filter((session) => session.completed_at).length,
        recommended_mode: "Step-by-step"
      }
    });
  }

  const [profileResult, preferencesResult, materialsResult, sessionsResult, progressResult] = await Promise.all([
    auth.supabase!.from("profiles").select("*").eq("user_id", auth.userId!).maybeSingle(),
    auth.supabase!.from("accessibility_preferences").select("*").eq("user_id", auth.userId!).maybeSingle(),
    auth.supabase!
      .from("learning_materials")
      .select("*")
      .eq("user_id", auth.userId!)
      .order("created_at", { ascending: false })
      .limit(6),
    auth.supabase!.from("learning_sessions").select("*").eq("user_id", auth.userId!),
    auth.supabase!.from("progress").select("*").eq("user_id", auth.userId!)
  ]);

  if (
    profileResult.error ||
    preferencesResult.error ||
    materialsResult.error ||
    sessionsResult.error ||
    progressResult.error
  ) {
    return fail("Could not load dashboard data.", 500, "dashboard_load_failed");
  }

  const materials = materialsResult.data.length
    ? materialsResult.data
    : [
        {
          id: "demo-preview",
          title: featuredLesson.title,
          description: featuredLesson.course,
          content_type: "text",
          original_content: featuredLesson.original,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: auth.userId!
        }
      ];

  return ok({
    mode: auth.mode,
    profile: profileResult.data,
    preferences: preferencesResult.data,
    materials,
    stats: {
      learning_streak: sessionsResult.data.length ? "Active" : "No sessions yet",
      focus_sessions: sessionsResult.data.filter((session) => session.mode.toLowerCase().includes("focus")).length,
      concepts_understood: progressResult.data.filter(
        (item) => item.status === "understood" || item.status === "mastered"
      ).length,
      materials_completed: sessionsResult.data.filter((session) => session.completed_at).length,
      recommended_mode: preferencesResult.data?.step_by_step_support ? "Step-by-step" : "Simplified"
    }
  });
}
