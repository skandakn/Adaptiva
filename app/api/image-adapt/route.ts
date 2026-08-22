import { analyzeUploadedImage } from "@/lib/ai-service";
import { handleApiError, ok } from "@/lib/api/http";
import { imageAdaptPayloadSchema } from "@/lib/api/validation";

export async function POST(request: Request) {
  try {
    const payload = imageAdaptPayloadSchema.parse(await request.json());
    const result = await analyzeUploadedImage(payload.action, payload.image, payload.filename);

    return ok({
      action: payload.action,
      result
    });
  } catch (error) {
    return handleApiError(error);
  }
}
