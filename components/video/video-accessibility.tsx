"use client";

import { Captions, FileVideo } from "lucide-react";
import { useEffect, useState } from "react";
import { ReadingContent } from "@/components/reading/reading-content";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";

type TranscriptSegment = {
  start: number;
  text: string;
};

type VideoProcessPayload = {
  transcription?: {
    text?: string;
    segments?: TranscriptSegment[];
  };
  summary?: string;
  error?: { message?: string };
};

type GenerateNotesPayload = {
  notes?: string;
  error?: { message?: string };
};

function getCompleteTranscript(transcription: VideoProcessPayload["transcription"], segments: TranscriptSegment[]) {
  const fullText = transcription?.text?.trim();
  if (fullText) return fullText;
  return segments
    .map((segment) => segment.text.trim())
    .filter(Boolean)
    .join(" ")
    .trim();
}

function formatTimestamp(seconds: number) {
  return `${seconds.toFixed(2)}s`;
}

export function VideoAccessibility() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [uploadedVideoFile, setUploadedVideoFile] = useState<File | null>(null);
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>([]);
  const [rawTranscript, setRawTranscript] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("Demo transcript is ready.");

  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setUploadedVideoFile(file);
    setTranscriptSegments([]);
    setRawTranscript("");
    setNotes("");
    setVideoUrl(URL.createObjectURL(file));
    setStatus("Video loaded. Demo transcription pipeline is active.");
    void transcribeUploadedVideo(file);
  }

  async function transcribeUploadedVideo(file: File) {
    try {
      const formData = new FormData();
      formData.append("title", "DNA recorded video lesson");
      formData.append("video", file);
      formData.append("save_material", "false");

      setStatus("Transcribing uploaded video...");
      const response = await fetch("/api/video/process", {
        method: "POST",
        body: formData
      });
      const payload = (await response.json()) as VideoProcessPayload;
      if (!response.ok) throw new Error(payload.error?.message ?? "Video transcription failed.");
      const segments = payload.transcription?.segments ?? [];
      setTranscriptSegments(segments);
      setRawTranscript(getCompleteTranscript(payload.transcription, segments));
      setStatus("Timestamped transcript generated from uploaded video.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Video transcription is unavailable.");
    }
  }

  async function generateNotes() {
    const transcript =
      rawTranscript.trim() ||
      transcriptSegments
        .map((segment) => segment.text.trim())
        .filter(Boolean)
        .join(" ")
        .trim();

    try {
      setStatus("Generating notes from transcript...");
      const response = await fetch("/api/generate-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ transcript })
      });
      const payload = (await response.json()) as GenerateNotesPayload;
      if (!response.ok) throw new Error(payload.error?.message ?? "Notes could not be generated.");
      if (!payload.notes?.trim()) throw new Error("Notes could not be generated.");
      setNotes(payload.notes);
      setStatus("Notes generated from the video transcript.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Notes could not be generated.");
    }
  }

  return (
    <div className="grid gap-6">
    <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      <Panel>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">Recorded Video Mode</p>
            <h1 className="mt-2 text-4xl font-black text-ink">Accessible video learning</h1>
          </div>
          <FileVideo aria-hidden="true" className="text-moss" size={32} />
        </div>
        <label className="mt-6 grid min-h-24 cursor-pointer place-items-center rounded-card border border-dashed border-moss/45 bg-mint/10 p-4 text-center font-black text-moss">
          Upload video
          <input
            className="sr-only"
            type="file"
            accept="video/*"
            onChange={(event) => handleFile(event.target.files?.[0])}
          />
        </label>
        <div className="mt-5 overflow-hidden rounded-card bg-ink">
          {videoUrl ? (
            <video className="aspect-video w-full" src={videoUrl} controls />
          ) : (
            <div className="grid aspect-video place-items-center p-6 text-center text-white">
              <div>
                <Captions aria-hidden="true" className="mx-auto mb-3" size={36} />
                <p className="font-black">Sample biology lecture preview</p>
                <p className="mt-2 text-sm text-white/75">Upload a file or continue with demo data.</p>
              </div>
            </div>
          )}
        </div>
        <div className="mt-4">
          <Button type="button" className="w-full sm:w-auto" onClick={() => void generateNotes()}>
            Generate Notes
          </Button>
        </div>
        <p className="mt-4 text-sm font-bold text-graphite">{status}</p>
      </Panel>
      <Panel>
        <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">AI Video Notes</p>
        <h2 className="mt-2 text-3xl font-black text-ink">Timestamped transcript</h2>
        <div className="mt-5 space-y-3">
          {transcriptSegments.length ? (
            transcriptSegments.map((segment, index) => (
              <div key={`${segment.start}-${index}`} className="grid grid-cols-[4rem_1fr] gap-3 rounded-card bg-paper p-3">
                <span className="font-black text-moss">{formatTimestamp(segment.start)}</span>
                <ReadingContent className="text-sm leading-7 text-graphite" text={segment.text} />
              </div>
            ))
          ) : (
            <div className="rounded-card bg-paper p-3">
              <ReadingContent
                className="text-sm leading-7 text-graphite"
                text="Upload and process a video to see timestamped transcript segments."
              />
            </div>
      </Panel>
    </div>
      {notes ? (
        <Panel>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">Generated notes</p>
          <h2 className="mt-2 text-3xl font-black text-ink">AI video notes</h2>
          <div className="mt-5 rounded-card bg-paper p-4">
            <ReadingContent className="text-sm leading-7 text-graphite" text={notes} />
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
