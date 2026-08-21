create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  reading_style text not null default 'Dyslexia-friendly',
  font_size integer not null default 18 check (font_size between 14 and 32),
  line_spacing numeric not null default 1.7 check (line_spacing between 1.0 and 3.0),
  letter_spacing numeric not null default 0.04 check (letter_spacing between 0 and 0.2),
  focus_mode boolean not null default true,
  audio_enabled boolean not null default true,
  audio_speed numeric not null default 1.0 check (audio_speed between 0.5 and 2.0),
  preferred_language text not null default 'English',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.accessibility_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  dyslexia_support boolean not null default true,
  focus_support boolean not null default true,
  audio_support boolean not null default true,
  visual_support boolean not null default true,
  language_support boolean not null default false,
  step_by_step_support boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.learning_materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  content_type text not null check (content_type in ('pdf', 'text', 'image', 'video', 'live_lecture')),
  original_content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.learning_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  material_id uuid references public.learning_materials(id) on delete set null,
  mode text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0)
);

create table if not exists public.saved_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  material_id uuid references public.learning_materials(id) on delete set null,
  title text not null,
  content text not null,
  note_type text not null default 'adapted_note',
  created_at timestamptz not null default now()
);

create table if not exists public.progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  material_id uuid references public.learning_materials(id) on delete set null,
  concept text not null,
  status text not null default 'learning' check (status in ('not_started', 'learning', 'understood', 'mastered')),
  mastery_level integer not null default 0 check (mastery_level between 0 and 100),
  updated_at timestamptz not null default now(),
  unique (user_id, material_id, concept)
);

create index if not exists learning_materials_user_created_idx on public.learning_materials(user_id, created_at desc);
create index if not exists learning_sessions_user_started_idx on public.learning_sessions(user_id, started_at desc);
create index if not exists saved_notes_user_created_idx on public.saved_notes(user_id, created_at desc);
create index if not exists progress_user_updated_idx on public.progress(user_id, updated_at desc);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_accessibility_preferences_updated_at on public.accessibility_preferences;
create trigger set_accessibility_preferences_updated_at
before update on public.accessibility_preferences
for each row execute function public.set_updated_at();

drop trigger if exists set_learning_materials_updated_at on public.learning_materials;
create trigger set_learning_materials_updated_at
before update on public.learning_materials
for each row execute function public.set_updated_at();

drop trigger if exists set_progress_updated_at on public.progress;
create trigger set_progress_updated_at
before update on public.progress
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.accessibility_preferences enable row level security;
alter table public.learning_materials enable row level security;
alter table public.learning_sessions enable row level security;
alter table public.saved_notes enable row level security;
alter table public.progress enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = user_id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = user_id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "profiles_delete_own" on public.profiles for delete using (auth.uid() = user_id);

create policy "accessibility_preferences_select_own" on public.accessibility_preferences for select using (auth.uid() = user_id);
create policy "accessibility_preferences_insert_own" on public.accessibility_preferences for insert with check (auth.uid() = user_id);
create policy "accessibility_preferences_update_own" on public.accessibility_preferences for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "accessibility_preferences_delete_own" on public.accessibility_preferences for delete using (auth.uid() = user_id);

create policy "learning_materials_select_own" on public.learning_materials for select using (auth.uid() = user_id);
create policy "learning_materials_insert_own" on public.learning_materials for insert with check (auth.uid() = user_id);
create policy "learning_materials_update_own" on public.learning_materials for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "learning_materials_delete_own" on public.learning_materials for delete using (auth.uid() = user_id);

create policy "learning_sessions_select_own" on public.learning_sessions for select using (auth.uid() = user_id);
create policy "learning_sessions_insert_own" on public.learning_sessions for insert with check (auth.uid() = user_id);
create policy "learning_sessions_update_own" on public.learning_sessions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "learning_sessions_delete_own" on public.learning_sessions for delete using (auth.uid() = user_id);

create policy "saved_notes_select_own" on public.saved_notes for select using (auth.uid() = user_id);
create policy "saved_notes_insert_own" on public.saved_notes for insert with check (auth.uid() = user_id);
create policy "saved_notes_update_own" on public.saved_notes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "saved_notes_delete_own" on public.saved_notes for delete using (auth.uid() = user_id);

create policy "progress_select_own" on public.progress for select using (auth.uid() = user_id);
create policy "progress_insert_own" on public.progress for insert with check (auth.uid() = user_id);
create policy "progress_update_own" on public.progress for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "progress_delete_own" on public.progress for delete using (auth.uid() = user_id);
