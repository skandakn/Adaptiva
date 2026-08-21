import { generateFigureSpecification } from "@/lib/figure-service";
import { requireApiUser } from "@/lib/api/auth";
import { handleApiError, ok } from "@/lib/api/http";
import { figurePayloadSchema } from "@/lib/api/validation";
import { demoStore } from "@/lib/api/demo-store";

export async function POST(request: Request) {
  try {
    const payload = figurePayloadSchema.parse(await request.json());
    const auth = await requireApiUser();

    if (auth.response && payload.save) {
      return auth.response;
    }

    const spec = await generateFigureSpecification(
      payload.content,
      payload.figureType,
      payload.complexity
    );

    if (payload.save && auth.userId) {
      const content = JSON.stringify(spec);
      if (auth.mode === "demo") {
        demoStore.createNote({
          material_id: payload.material_id ?? null,
          title: `Figure: ${spec.title}`,
          content,
          note_type: "figure"
        });
      } else if (auth.supabase) {
        await auth.supabase.from("saved_notes").insert({
          user_id: auth.userId,
          material_id: payload.material_id ?? null,
          title: `Figure: ${spec.title}`,
          content,
          note_type: "figure"
        });
      }
    }

    return ok({
      mode: auth.mode,
      figure: spec
    });
  } catch (error) {
    return handleApiError(error);
  }
}
