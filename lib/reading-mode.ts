export const readingFonts = [
  { id: "standard", label: "Standard" },
  { id: "open-dyslexic", label: "OpenDyslexic" },
  { id: "lexend", label: "Lexend" },
  { id: "atkinson", label: "Atkinson Hyperlegible" }
] as const;

export const readingSpacingOptions = [
  { id: "normal", label: "Normal", lineHeight: 1.65, letterSpacing: 0, wordSpacing: 0, paragraphGap: "0.9rem", measure: "68ch" },
  {
    id: "comfortable",
    label: "Comfortable",
    lineHeight: 1.95,
    letterSpacing: 0.035,
    wordSpacing: 0.12,
    paragraphGap: "1.2rem",
    measure: "62ch"
  },
  { id: "wide", label: "Wide", lineHeight: 2.15, letterSpacing: 0.06, wordSpacing: 0.2, paragraphGap: "1.45rem", measure: "58ch" }
] as const;

export type ReadingFont = (typeof readingFonts)[number]["id"];
export type ReadingSpacing = (typeof readingSpacingOptions)[number]["id"];
export type ReadingSpeed = 0.75 | 1 | 1.25 | 1.5;

export type ReadingPreferences = {
  enabled: boolean;
  font: ReadingFont;
  textSize: number;
  spacing: ReadingSpacing;
  focusGuide: boolean;
  audioSpeed: ReadingSpeed;
  hasActivated: boolean;
};

export const defaultReadingPreferences: ReadingPreferences = {
  enabled: false,
  font: "standard",
  textSize: 18,
  spacing: "comfortable",
  focusGuide: false,
  audioSpeed: 1,
  hasActivated: false
};

export function getReadingFontLabel(font: ReadingFont) {
  return readingFonts.find((item) => item.id === font)?.label ?? "Standard";
}

export function getReadingFontFamily(font: ReadingFont) {
  if (font === "open-dyslexic") return '"OpenDyslexic", "Atkinson Hyperlegible", sans-serif';
  if (font === "lexend") return '"Lexend", "Atkinson Hyperlegible", sans-serif';
  if (font === "atkinson") return '"Atkinson Hyperlegible", "Lexend", sans-serif';
  return 'var(--font-readable)';
}

export function getReadingSpacing(spacing: ReadingSpacing) {
  return readingSpacingOptions.find((item) => item.id === spacing) ?? readingSpacingOptions[1];
}

export function normalizeReadingFont(value?: string | null): ReadingFont {
  const normalized = value?.toLowerCase() ?? "";
  if (normalized.includes("open") || normalized.includes("dyslexia")) return "open-dyslexic";
  if (normalized.includes("lexend")) return "lexend";
  if (normalized.includes("atkinson")) return "atkinson";
  return "standard";
}

export function normalizeReadingSpacing(lineHeight?: number | null): ReadingSpacing {
  if (!lineHeight) return "comfortable";
  if (lineHeight >= 2.08) return "wide";
  if (lineHeight >= 1.8) return "comfortable";
  return "normal";
}

export function splitIntoSentences(text: string) {
  const matches = text.match(/[^.!?\n]+[.!?]+|\S[^.!?\n]*$/g);
  return (matches ?? [text]).map((sentence) => sentence.trim()).filter(Boolean);
}

export function readingPreferencesToProfilePayload(preferences: ReadingPreferences) {
  const spacing = getReadingSpacing(preferences.spacing);

  return {
    reading_style: getReadingFontLabel(preferences.font),
    font_size: preferences.textSize,
    line_spacing: spacing.lineHeight,
    letter_spacing: spacing.letterSpacing,
    focus_mode: preferences.focusGuide,
    audio_enabled: true,
    audio_speed: preferences.audioSpeed,
    preferences: {
      dyslexia_support: preferences.enabled,
      focus_support: preferences.focusGuide,
      audio_support: true,
      step_by_step_support: true
    }
  };
}
