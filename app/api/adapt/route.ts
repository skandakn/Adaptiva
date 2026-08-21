import { NextResponse } from "next/server";
import {
  askTutor,
  explainStepByStep,
  extractConcepts,
  generateMindMap,
  generateQuiz,
  simplifyText,
  summarizeContent,
  translateContent
} from "@/lib/ai-service";
import { requireApiUser } from "@/lib/api/auth";
import { fail, handleApiError, ok } from "@/lib/api/http";
import { adaptPayloadSchema } from "@/lib/api/validation";
import { demoStore } from "@/lib/api/demo-store";

export async function POST(request: Request) {
  try {
    const payload = adaptPayloadSchema.parse(await request.json());
    const auth = await requireApiUser();

    if (auth.response && (payload.material_id || payload.save_as_note)) {
      return auth.response;
    }

    let result: unknown;
    if (payload.action === "simplify") result = await simplifyText(payload.text, payload.level);
    if (payload.action === "summarize") result = await summarizeContent(payload.text);
    if (payload.action === "step-by-step") result = await explainStepByStep(payload.text);
    if (payload.action === "mind-map") result = await generateMindMap(payload.text);
    if (payload.action === "quiz") result = await generateQuiz(payload.text);
    if (payload.action === "translate") result = await translateContent(payload.language, payload.text);
    if (payload.action === "concepts") result = await extractConcepts(payload.text);
    if (payload.action === "ask") result = await askTutor(payload.text, payload.question);

    if (payload.save_as_note && auth.userId) {
      const content = typeof result === "string" ? result : JSON.stringify(result, null, 2);
      if (auth.mode === "demo") {
        demoStore.createNote({
          material_id: payload.material_id ?? null,
          title: `Adaptiva ${payload.action}`,
          content,
          note_type: payload.action
        });
      } else {
        if (payload.material_id) {
          const { data: material } = await auth.supabase!
            .from("learning_materials")
            .select("id")
            .eq("id", payload.material_id)
            .eq("user_id", auth.userId)
            .maybeSingle();
          if (!material) return fail("Material not found.", 404, "material_not_found");
        }
        await auth.supabase!.from("saved_notes").insert({
          user_id: auth.userId,
          material_id: payload.material_id ?? null,
          title: `Adaptiva ${payload.action}`,
          content,
          note_type: payload.action
        });
      }
    }

    return ok({
      mode: auth.mode,
      action: payload.action,
      result
    });
  } catch (error) {
    return handleApiError(error);
  }
}
