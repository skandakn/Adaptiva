import { extractConcepts, summarizeContent } from "@/lib/ai-service";
import { requireApiUser } from "@/lib/api/auth";
import { demoStore } from "@/lib/api/demo-store";
import { fail, handleApiError, ok } from "@/lib/api/http";
import { videoProcessSchema } from "@/lib/api/validation";
import { featuredLesson } from "@/lib/demo-data";

const demoTranscript = featuredLesson.transcript.map((line) => `${line.time} ${line.text}`).join("\n");

export async function POST(request: Request) {
  try {
    const payload = videoProcessSchema.parse(await request.json());
    const auth = await requireApiUser();
    if (auth.response) return auth.response;

    const transcript = payload.transcript?.trim() || demoTranscript;
    const [summary, concepts] = await Promise.all([summarizeContent(transcript), extractConcepts(transcript)]);
    const chapters = featuredLesson.transcript.map((line, index) => ({
      time: line.time,
      title: index === 0 ? "Introduction" : index === 1 ? "Semi-conservative copying" : index === 2 ? "Key enzymes" : "Result"
    }));

    if (auth.mode === "demo") {
      const material = payload.save_material
        ? demoStore.createMaterial({
            title: payload.title,
            description: "Recorded video transcript saved through demo persistence",
            content_type: "video",
            original_content: transcript
          })
        : null;
      const note = demoStore.createNote({
        material_id: material?.id ?? null,
        title: `${payload.title} accessible summary`,
        content: summary,
        note_type: "video_summary"
      });
      return ok({ mode: auth.mode, transcript, summary, concepts, chapters, material, note }, { status: 201 });
    }

    let materialId: string | null = null;
    if (payload.save_material) {
      const { data, error } = await auth.supabase!
        .from("learning_materials")
        .insert({
          user_id: auth.userId!,
          title: payload.title,
          description: "Recorded video transcript",
          content_type: "video",
          original_content: transcript
        })
        .select()
        .single();
      if (error) return fail("Could not save video material.", 500, "video_material_save_failed");
      materialId = data.id;
    }

    const { data: note, error: noteError } = await auth.supabase!
      .from("saved_notes")
      .insert({
        user_id: auth.userId!,
        material_id: materialId,
        title: `${payload.title} accessible summary`,
        content: summary,
        note_type: "video_summary"
      })
      .select()
      .single();

    if (noteError) return fail("Could not save video summary.", 500, "video_note_save_failed");
    return ok({ mode: auth.mode, transcript, summary, concepts, chapters, material_id: materialId, note }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
