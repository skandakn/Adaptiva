# Adaptiva

Technology that adapts to the way you learn.

Adaptiva is an AI-powered adaptive accessibility platform that transforms educational content according to a learner's accessibility preferences. It supports a full hackathon demo experience without external API keys through realistic demo-mode data, and it can persist real user data with Supabase/PostgreSQL when configured.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment

Copy `.env.example` to `.env.local` and fill in the values you want to use.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_ADAPTIVA_DEMO_MODE=true
AI_PROVIDER=groq
AI_MODEL=openai/gpt-oss-20b
AI_VISION_MODEL=qwen/qwen3.6-27b
GROQ_API_KEY=
```

Without Supabase variables, local development uses demo fallback persistence. Production should configure Supabase and should not fake authentication.

## Database setup

Run the migration in `supabase/migrations/20260821173000_initial_adaptiva_schema.sql` in your Supabase project.

The migration creates:

- `profiles`
- `accessibility_preferences`
- `learning_materials`
- `learning_sessions`
- `saved_notes`
- `progress`
- Row Level Security policies so users only access their own rows

## Demo flow

1. Start at `/` and click **Try Adaptiva**.
2. Create an adaptive profile.
3. Open `/learn` and click **Adapt This**.
4. Try audio mode, mind map mode, translation, and OCR fallback.
5. Open `/live` to demonstrate microphone transcription with graceful demo fallback.
6. Open `/video` for recorded video accessibility.
7. Open `/architecture` for the interactive system diagram.

## Routes

- `/` landing page
- `/onboarding` accessibility personalization
- `/dashboard` student dashboard
- `/learn` adaptive learning workspace
- `/live` live lecture mode
- `/video` recorded video mode
- `/tutor` AI tutor
- `/settings` accessibility settings
- `/progress` learning progress
- `/teacher` teacher dashboard
- `/architecture` system architecture
- `/about` problem, solution, and impact

## Architecture

The app now includes:

- Clerk sign-in, sign-up, account controls, and protected workspace routes
- Supabase-ready persistence APIs remain available when Supabase is configured
- API routes for profiles, materials, notes, live notes, video processing, dashboard data, progress, and adaptation
- Demo fallback when Supabase persistence or AI credentials are not configured

The UI calls clean service abstractions in `lib/ai-service.ts`:

- `simplifyText`
- `summarizeContent`
- `explainStepByStep`
- `generateMindMap`
- `generateQuiz`
- `translateContent`
- `extractConcepts`
- `analyzeAccessibilityNeeds`

When `GROQ_API_KEY` is not configured, the app stays in demo mode. API keys should remain server-side.
