import { askAdaptivaChat } from "@/lib/ai-service";
import { fail, handleApiError, ok } from "@/lib/api/http";
import { chatPayloadSchema } from "@/lib/api/validation";

export async function POST(request: Request) {
  try {
    const payload = chatPayloadSchema.parse(await request.json());
    const content = await askAdaptivaChat(payload.messages, payload.context);

    if (!content) {
      return fail("Ask Adaptiva is not available.", 503, "ai_chat_unavailable");
    }

    return ok({
      reply: {
        role: "assistant",
        content
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
