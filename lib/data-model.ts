export const supabaseReadySchema = `
create table profiles (
  id uuid primary key,
  user_id uuid not null,
  reading_style text not null,
  focus_mode boolean default false,
  audio_speed numeric default 1.0,
  preferred_language text default 'English',
  created_at timestamptz default now()
);

create table materials (
  id uuid primary key,
  owner_id uuid not null,
  title text not null,
  source_type text not null,
  storage_path text,
  created_at timestamptz default now()
);

create table adaptations (
  id uuid primary key,
  material_id uuid references materials(id),
  profile_id uuid references profiles(id),
  adapted_text text,
  key_concepts jsonb,
  mind_map jsonb,
  created_at timestamptz default now()
);
`;
