import { requireApiUser, usesDemoStore } from "@/lib/api/auth";
import { demoStore } from "@/lib/api/demo-store";
import { fail, handleApiError, ok } from "@/lib/api/http";
import { noteCreateSchema } from "@/lib/api/validation";

export async function GET() {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;

  if (usesDemoStore(auth.mode)) {
    return ok({ mode: auth.mode, notes: demoStore.listNotes() });
  }

  const { data, error } = await auth.supabase!
    .from("saved_notes")
    .select("*")
    .eq("user_id", auth.userId!)
    .order("created_at", { ascending: false });

  if (error) return fail("Could not load saved notes.", 500, "notes_load_failed");
  return ok({ mode: auth.mode, notes: data });
}

export async function POST(request: Request) {
  try {
    const payload = noteCreateSchema.parse(await request.json());
    const auth = await requireApiUser();
    if (auth.response) return auth.response;

    if (usesDemoStore(auth.mode)) {
      return ok({
        mode: auth.mode,
        note: demoStore.createNote({ ...payload, material_id: payload.material_id ?? null })
      }, { status: 201 });
    }

    if (payload.material_id) {
      const { data: material } = await auth.supabase!
        .from("learning_materials")
        .select("id")
        .eq("id", payload.material_id)
        .eq("user_id", auth.userId!)
        .maybeSingle();
      if (!material) return fail("Material not found.", 404, "material_not_found");
    }

    const { data, error } = await auth.supabase!
      .from("saved_notes")
      .insert({ ...payload, user_id: auth.userId! })
      .select()
      .single();

    if (error) return fail("Could not save note.", 500, "note_save_failed");
    return ok({ mode: auth.mode, note: data }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
