# Adaptiva

Technology that adapts to the way you learn.

Adaptiva is an AI-powered adaptive accessibility platform that transforms educational content according to a learner's accessibility preferences. It supports a full hackathon demo experience without external API keys through realistic demo-mode data.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

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

The UI calls clean service abstractions in `lib/ai-service.ts`:

- `simplifyText`
- `summarizeContent`
- `explainStepByStep`
- `generateMindMap`
- `generateQuiz`
- `translateContent`
- `extractConcepts`
- `analyzeAccessibilityNeeds`

When `OPENAI_API_KEY` is not configured, the app stays in demo mode. API keys should remain server-side.
