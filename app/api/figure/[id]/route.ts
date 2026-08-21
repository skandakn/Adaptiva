import { requireApiUser } from "@/lib/api/auth";
import { fail, handleApiError, ok } from "@/lib/api/http";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireApiUser();
    if (auth.response) return auth.response;

    if (auth.mode === "demo") {
      // In demo mode we don't persist, return a not-found
      return fail(`Figure ${id} not found in demo mode.`, 404, "not_found");
    }

    const { data, error } = await auth.supabase!
      .from("saved_notes")
      .select("*")
      .eq("id", id)
      .eq("user_id", auth.userId!)
      .eq("note_type", "figure")
      .maybeSingle();

    if (error || !data) return fail("Figure not found.", 404, "not_found");

    const spec = JSON.parse(data.content as string);
    return ok({ figure: spec });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireApiUser();
    if (auth.response) return auth.response;

    if (auth.mode === "demo") {
      return ok({ deleted: true, mode: "demo" });
    }

    const { error } = await auth.supabase!
      .from("saved_notes")
      .delete()
      .eq("id", id)
      .eq("user_id", auth.userId!)
      .eq("note_type", "figure");

    if (error) return fail("Could not delete figure.", 500, "delete_error");

    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
