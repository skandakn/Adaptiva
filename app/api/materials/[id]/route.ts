import { requireApiUser } from "@/lib/api/auth";
import { demoStore } from "@/lib/api/demo-store";
import { fail, handleApiError, ok } from "@/lib/api/http";
import { materialUpdateSchema } from "@/lib/api/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const auth = await requireApiUser();
  if (auth.response) return auth.response;

  if (auth.mode === "demo") {
    const material = demoStore.getMaterial(id);
    return material ? ok({ mode: auth.mode, material }) : fail("Material not found.", 404, "material_not_found");
  }

  const { data, error } = await auth.supabase!
    .from("learning_materials")
    .select("*")
    .eq("id", id)
    .eq("user_id", auth.userId!)
    .maybeSingle();

  if (error) return fail("Could not load learning material.", 500, "material_load_failed");
  return data ? ok({ mode: auth.mode, material: data }) : fail("Material not found.", 404, "material_not_found");
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const payload = materialUpdateSchema.parse(await request.json());
    const auth = await requireApiUser();
    if (auth.response) return auth.response;

    if (auth.mode === "demo") {
      const material = demoStore.updateMaterial(id, payload);
      return material ? ok({ mode: auth.mode, material }) : fail("Material not found.", 404, "material_not_found");
    }

    const { data, error } = await auth.supabase!
      .from("learning_materials")
      .update(payload)
      .eq("id", id)
      .eq("user_id", auth.userId!)
      .select()
      .maybeSingle();

    if (error) return fail("Could not update learning material.", 500, "material_update_failed");
    return data ? ok({ mode: auth.mode, material: data }) : fail("Material not found.", 404, "material_not_found");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const auth = await requireApiUser();
  if (auth.response) return auth.response;

  if (auth.mode === "demo") {
    return demoStore.deleteMaterial(id)
      ? ok({ mode: auth.mode, deleted: true })
      : fail("Material not found.", 404, "material_not_found");
  }

  const { error, count } = await auth.supabase!
    .from("learning_materials")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("user_id", auth.userId!);

  if (error) return fail("Could not delete learning material.", 500, "material_delete_failed");
  return count ? ok({ mode: auth.mode, deleted: true }) : fail("Material not found.", 404, "material_not_found");
}
