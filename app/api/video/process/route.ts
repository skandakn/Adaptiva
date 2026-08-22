import { requireApiUser } from "@/lib/api/auth";
import { fail, handleApiError, ok } from "@/lib/api/http";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const uploadedVideo = formData.get("video");

    if (!(uploadedVideo instanceof File) || uploadedVideo.size === 0) {
      return fail("Video file is required.", 400, "video_file_required");
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return fail("Groq API key is not configured.", 500, "groq_api_key_missing");
    }

    const auth = await requireApiUser();

    const transcriptionFormData = new FormData();
    transcriptionFormData.append("file", uploadedVideo, uploadedVideo.name);
    transcriptionFormData.append("model", "whisper-large-v3-turbo");
    transcriptionFormData.append("response_format", "verbose_json");
    transcriptionFormData.append("timestamp_granularities[]", "segment");

    const transcriptionResponse = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqApiKey}`
      },
      body: transcriptionFormData
    });
    const transcription = await transcriptionResponse.json();

    if (!transcriptionResponse.ok) {
      return fail("Video transcription failed.", transcriptionResponse.status, "groq_transcription_failed");
    }

    return ok(
      {
        mode: auth.mode,
        video: {
          name: uploadedVideo.name,
          size: uploadedVideo.size,
          type: uploadedVideo.type
        },
        transcription
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
