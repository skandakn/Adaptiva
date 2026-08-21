import { handleApiError, ok } from "@/lib/api/http";
import { translatePayloadSchema } from "@/lib/api/validation";
import { translateUiStrings } from "@/lib/translation-service";

export async function POST(request: Request) {
  try {
    const payload = translatePayloadSchema.parse(await request.json());
    const result = await translateUiStrings(payload.language, payload.texts);
    return ok({ language: payload.language, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}
