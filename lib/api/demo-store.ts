import { featuredLesson, modeUsageData, progressData } from "@/lib/demo-data";
import { demoUserId } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type PreferencesRow = Database["public"]["Tables"]["accessibility_preferences"]["Row"];
type MaterialRow = Database["public"]["Tables"]["learning_materials"]["Row"];
type NoteRow = Database["public"]["Tables"]["saved_notes"]["Row"];
type ProgressRow = Database["public"]["Tables"]["progress"]["Row"];
type SessionRow = Database["public"]["Tables"]["learning_sessions"]["Row"];

const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();

const seedMaterialId = "11111111-1111-4111-8111-111111111111";

const demoProfile: ProfileRow = {
  id: "22222222-2222-4222-8222-222222222222",
  user_id: demoUserId,
  reading_style: "Dyslexia-friendly",
  font_size: 18,
  line_spacing: 1.7,
  letter_spacing: 0.04,
  focus_mode: true,
  audio_enabled: true,
  audio_speed: 1,
  preferred_language: "English",
  created_at: now(),
  updated_at: now()
};

const demoPreferences: PreferencesRow = {
  id: "33333333-3333-4333-8333-333333333333",
  user_id: demoUserId,
  dyslexia_support: true,
  focus_support: true,
  audio_support: true,
  visual_support: true,
  language_support: false,
  step_by_step_support: true,
  created_at: now(),
  updated_at: now()
};

const materials: MaterialRow[] = [
  {
    id: seedMaterialId,
    user_id: demoUserId,
    title: featuredLesson.title,
    description: featuredLesson.course,
    content_type: "text",
    original_content: featuredLesson.original,
    created_at: now(),
    updated_at: now()
  }
];

const notes: NoteRow[] = [];

const progressRows: ProgressRow[] = featuredLesson.keyConcepts.map((concept, index) => ({
  id: id(),
  user_id: demoUserId,
  material_id: seedMaterialId,
  concept,
  status: index < 3 ? "mastered" : "learning",
  mastery_level: index < 3 ? 86 : 48,
  updated_at: now()
}));

const sessions: SessionRow[] = [
  {
    id: id(),
    user_id: demoUserId,
    material_id: seedMaterialId,
    mode: "Simplified",
    started_at: now(),
    completed_at: now(),
    duration_seconds: 1380
  },
  {
    id: id(),
    user_id: demoUserId,
    material_id: seedMaterialId,
    mode: "Focus",
    started_at: now(),
    completed_at: now(),
    duration_seconds: 960
  }
];

let profile = demoProfile;
let preferences = demoPreferences;

export const demoStore = {
  getProfile() {
    return { profile, preferences };
  },
  saveProfile(payload: Partial<ProfileRow> & { preferences?: Partial<PreferencesRow> }) {
    profile = {
      ...profile,
      ...payload,
      id: profile.id,
      user_id: demoUserId,
      updated_at: now()
    };
    if (payload.preferences) {
      preferences = {
        ...preferences,
        ...payload.preferences,
        id: preferences.id,
        user_id: demoUserId,
        updated_at: now()
      };
    }
    return { profile, preferences };
  },
  listMaterials() {
    return [...materials].sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  getMaterial(materialId: string) {
    return materials.find((material) => material.id === materialId) ?? null;
  },
  createMaterial(payload: Pick<MaterialRow, "title" | "description" | "content_type" | "original_content">) {
    const material: MaterialRow = {
      id: id(),
      user_id: demoUserId,
      created_at: now(),
      updated_at: now(),
      ...payload
    };
    materials.unshift(material);
    return material;
  },
  updateMaterial(materialId: string, payload: Partial<MaterialRow>) {
    const index = materials.findIndex((material) => material.id === materialId);
    if (index < 0) return null;
    materials[index] = {
      ...materials[index],
      ...payload,
      id: materialId,
      user_id: demoUserId,
      updated_at: now()
    };
    return materials[index];
  },
  deleteMaterial(materialId: string) {
    const index = materials.findIndex((material) => material.id === materialId);
    if (index < 0) return false;
    materials.splice(index, 1);
    return true;
  },
  listNotes() {
    return [...notes].sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  createNote(payload: Pick<NoteRow, "material_id" | "title" | "content" | "note_type">) {
    const note: NoteRow = {
      id: id(),
      user_id: demoUserId,
      created_at: now(),
      ...payload
    };
    notes.unshift(note);
    return note;
  },
  saveProgress(payload: Pick<ProgressRow, "material_id" | "concept" | "status" | "mastery_level">) {
    const existing = progressRows.find(
      (row) => row.material_id === payload.material_id && row.concept === payload.concept
    );
    if (existing) {
      existing.status = payload.status;
      existing.mastery_level = payload.mastery_level;
      existing.updated_at = now();
      return existing;
    }
    const row: ProgressRow = {
      id: id(),
      user_id: demoUserId,
      updated_at: now(),
      ...payload
    };
    progressRows.unshift(row);
    return row;
  },
  createSession(payload: Pick<SessionRow, "material_id" | "mode" | "duration_seconds" | "completed_at">) {
    const session: SessionRow = {
      id: id(),
      user_id: demoUserId,
      started_at: now(),
      ...payload
    };
    sessions.unshift(session);
    return session;
  },
  getProgressSummary() {
    return {
      progress: progressRows,
      sessions,
      charts: { progressData, modeUsageData }
    };
  }
};
