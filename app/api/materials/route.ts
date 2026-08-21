import { requireApiUser } from "@/lib/api/auth";
import { demoStore } from "@/lib/api/demo-store";
import { fail, handleApiError, ok } from "@/lib/api/http";
import { materialCreateSchema } from "@/lib/api/validation";

export async function GET() {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;

  if (auth.mode === "demo") {
    return ok({ mode: auth.mode, materials: demoStore.listMaterials() });
  }

  const { data, error } = await auth.supabase!
    .from("learning_materials")
    .select("*")
    .eq("user_id", auth.userId!)
    .order("created_at", { ascending: false });

  if (error) return fail("Could not load learning materials.", 500, "materials_load_failed");
  return ok({ mode: auth.mode, materials: data });
}

export async function POST(request: Request) {
  try {
    const payload = materialCreateSchema.parse(await request.json());
    const auth = await requireApiUser();
    if (auth.response) return auth.response;

    if (auth.mode === "demo") {
      return ok({
        mode: auth.mode,
        material: demoStore.createMaterial({ ...payload, description: payload.description ?? null })
      }, { status: 201 });
    }

    const { data, error } = await auth.supabase!
      .from("learning_materials")
      .insert({ ...payload, user_id: auth.userId! })
      .select()
      .single();

    if (error) return fail("Could not create learning material.", 500, "material_create_failed");
    return ok({ mode: auth.mode, material: data }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
