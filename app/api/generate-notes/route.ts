import { generateNotesFromTranscript } from "@/lib/ai-service";
import { fail, handleApiError, ok } from "@/lib/api/http";
import { generateNotesPayloadSchema } from "@/lib/api/validation";

export async function POST(request: Request) {
  try {
    const payload = generateNotesPayloadSchema.parse(await request.json());
    const transcript = payload.transcript.trim();

    if (!transcript) {
      return fail("Transcript is required.", 400, "transcript_required");
    }

    const notes = await generateNotesFromTranscript(transcript);

    if (!notes) {
      return fail("Notes could not be generated.", 503, "notes_unavailable");
    }

    return ok({ notes });
  } catch (error) {
    return handleApiError(error);
  }
}
