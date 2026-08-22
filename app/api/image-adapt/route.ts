import { aiRuntime, analyzeUploadedImage } from "@/lib/ai-service";
import { handleApiError, ok } from "@/lib/api/http";
import { imageAdaptPayloadSchema } from "@/lib/api/validation";

export async function POST(request: Request) {
  try {
    const payload = imageAdaptPayloadSchema.parse(await request.json());
    const result = await analyzeUploadedImage(payload.action, payload.image, payload.filename);

    return ok({
      action: payload.action,
      result,
      // Tell the client that this is the metadata-only demo response so it can
      // run OCR instead of presenting the fallback as an image explanation.
      fallback: aiRuntime.demoMode
    });
  } catch (error) {
    return handleApiError(error);
  }
}
