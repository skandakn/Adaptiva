export const supabaseReadySchema = `
create table profiles (
  id uuid primary key,
  user_id uuid not null,
  reading_style text not null,
  font_size integer default 18,
  line_spacing numeric default 1.7,
  letter_spacing numeric default 0.04,
  focus_mode boolean default false,
  audio_enabled boolean default true,
  audio_speed numeric default 1.0,
  preferred_language text default 'English',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table accessibility_preferences (
  id uuid primary key,
  user_id uuid not null,
  dyslexia_support boolean default true,
  focus_support boolean default true,
  audio_support boolean default true,
  visual_support boolean default true,
  language_support boolean default false,
  step_by_step_support boolean default true
);

create table learning_materials (
  id uuid primary key,
  user_id uuid not null,
  title text not null,
  content_type text not null,
  original_content text not null,
  created_at timestamptz default now()
);

create table saved_notes (
  id uuid primary key,
  user_id uuid not null,
  material_id uuid references learning_materials(id),
  content text not null,
  created_at timestamptz default now()
);

-- Full migration includes sessions, progress, triggers, indexes, and RLS policies.
`;
