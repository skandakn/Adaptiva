import { z } from "zod";

export const languageSchema = z.enum(["English", "Kannada", "Hindi"]);

export const contentTypeSchema = z.enum(["pdf", "text", "image", "video", "live_lecture"]);

export const profilePayloadSchema = z.object({
  reading_style: z.string().min(1).max(80).optional(),
  font_size: z.number().int().min(14).max(32).optional(),
  line_spacing: z.number().min(1).max(3).optional(),
  letter_spacing: z.number().min(0).max(0.2).optional(),
  focus_mode: z.boolean().optional(),
  audio_enabled: z.boolean().optional(),
  audio_speed: z.number().min(0.5).max(2).optional(),
  preferred_language: languageSchema.optional(),
  preferences: z
    .object({
      dyslexia_support: z.boolean().optional(),
      focus_support: z.boolean().optional(),
      audio_support: z.boolean().optional(),
      visual_support: z.boolean().optional(),
      language_support: z.boolean().optional(),
      step_by_step_support: z.boolean().optional()
    })
    .optional()
});

export const materialCreateSchema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().max(400).optional().nullable(),
  content_type: contentTypeSchema,
  original_content: z.string().min(1).max(50000)
});

export const materialUpdateSchema = materialCreateSchema.partial();

export const noteCreateSchema = z.object({
  material_id: z.string().uuid().optional().nullable(),
  title: z.string().min(1).max(160),
  content: z.string().min(1).max(50000),
  note_type: z.string().min(1).max(80).default("adapted_note")
});

export const progressCreateSchema = z.object({
  material_id: z.string().uuid().optional().nullable(),
  concept: z.string().min(1).max(160),
  status: z.enum(["not_started", "learning", "understood", "mastered"]).default("learning"),
  mastery_level: z.number().int().min(0).max(100).default(0),
  session: z
    .object({
      mode: z.string().min(1).max(80),
      duration_seconds: z.number().int().min(0).optional(),
      completed: z.boolean().default(false)
    })
    .optional()
});

export const adaptPayloadSchema = z.object({
  action: z.enum([
    "simplify",
    "summarize",
    "step-by-step",
    "mind-map",
    "quiz",
    "translate",
    "concepts",
    "ask"
  ]),
  text: z.string().min(1).max(50000),
  level: z.enum(["simple", "very-simple", "new"]).default("simple"),
  language: languageSchema.default("English"),
  question: z.string().max(500).optional(),
  mind_map: z
    .object({
      id: z.string(),
      label: z.string(),
      children: z.array(z.any()).optional()
    })
    .optional(),
  material_id: z.string().uuid().optional().nullable(),
  save_as_note: z.boolean().default(false)
});

export const liveNoteSchema = z.object({
  transcript: z.string().min(1).max(50000),
  title: z.string().min(1).max(160).default("Live lecture notes"),
  notes: z.string().max(50000).optional(),
  save_material: z.boolean().default(true)
});

export const videoProcessSchema = z.object({
  title: z.string().min(1).max(160).default("Recorded video lesson"),
  transcript: z.string().min(1).max(50000).optional(),
  save_material: z.boolean().default(true)
});

export const figureTypeSchema = z.enum([
  "auto",
  "process",
  "flowchart",
  "concept-map",
  "cycle",
  "comparison",
  "timeline",
  "system",
  "annotated",
  "infographic"
]);

export const figurePayloadSchema = z.object({
  content: z.string().min(1).max(20000),
  figureType: figureTypeSchema.default("auto"),
  complexity: z.enum(["simple", "detailed"]).default("simple"),
  material_id: z.string().uuid().optional().nullable(),
  save: z.boolean().default(false)
});

export const figureRegenerateSchema = z.object({
  complexity: z.enum(["simple", "detailed"]).optional(),
  figureType: figureTypeSchema.optional()
});
