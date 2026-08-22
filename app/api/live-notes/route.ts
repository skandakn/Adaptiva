import { requireApiUser, usesDemoStore } from "@/lib/api/auth";
import { demoStore } from "@/lib/api/demo-store";
import { fail, handleApiError, ok } from "@/lib/api/http";
import { liveNoteSchema } from "@/lib/api/validation";

export async function POST(request: Request) {
  try {
    const payload = liveNoteSchema.parse(await request.json());
    const auth = await requireApiUser();
    if (auth.response) return auth.response;

    const noteContent = payload.notes
      ? `${payload.notes}\n\nTranscript:\n${payload.transcript}`
      : payload.transcript;

    if (usesDemoStore(auth.mode)) {
      const material = payload.save_material
        ? demoStore.createMaterial({
            title: payload.title,
            description: "Saved live lecture transcript",
            content_type: "live_lecture",
            original_content: payload.transcript
          })
        : null;
      const note = demoStore.createNote({
        material_id: material?.id ?? null,
        title: payload.title,
        content: noteContent,
        note_type: "live_lecture"
      });
      return ok({ mode: auth.mode, material, note }, { status: 201 });
    }

    let materialId: string | null = null;
    if (payload.save_material) {
      const { data, error } = await auth.supabase!
        .from("learning_materials")
        .insert({
          user_id: auth.userId!,
          title: payload.title,
          description: "Saved live lecture transcript",
          content_type: "live_lecture",
          original_content: payload.transcript
        })
        .select()
        .single();
      if (error) return fail("Could not save lecture material.", 500, "lecture_material_save_failed");
      materialId = data.id;
    }

    const { data: note, error: noteError } = await auth.supabase!
      .from("saved_notes")
      .insert({
        user_id: auth.userId!,
        material_id: materialId,
        title: payload.title,
        content: noteContent,
        note_type: "live_lecture"
      })
      .select()
      .single();

    if (noteError) return fail("Could not save lecture note.", 500, "lecture_note_save_failed");
    return ok({ mode: auth.mode, material_id: materialId, note }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
