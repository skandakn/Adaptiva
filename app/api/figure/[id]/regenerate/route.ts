import { generateFigureSpecification } from "@/lib/figure-service";
import { requireApiUser } from "@/lib/api/auth";
import { handleApiError, ok } from "@/lib/api/http";
import { figureRegenerateSchema } from "@/lib/api/validation";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await params; // consume id param
    const body = figureRegenerateSchema.parse(await request.json());
    const auth = await requireApiUser();

    if (auth.response) return auth.response;

    const content = (body as { content?: string }).content ?? "";
    const spec = await generateFigureSpecification(
      content,
      body.figureType ?? "auto",
      body.complexity
    );

    return ok({ mode: auth.mode, figure: spec });
  } catch (error) {
    return handleApiError(error);
  }
}
