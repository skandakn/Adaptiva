"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  defaultReadingPreferences,
  getReadingFontFamily,
  getReadingSpacing,
  normalizeReadingFont,
  normalizeReadingSpacing,
  readingPreferencesToProfilePayload,
  splitIntoSentences
} from "@/lib/reading-mode";
import type { ReadingFont, ReadingPreferences, ReadingSpacing, ReadingSpeed } from "@/lib/reading-mode";

const storageKey = "adaptiva.reading-mode.v1";

type SpeechState = {
  text: string | null;
  activeSentence: number;
  isSpeaking: boolean;
  status: string;
};

type ReadingModeContextValue = {
  preferences: ReadingPreferences;
  hydrated: boolean;
  speech: SpeechState;
  setEnabled: (enabled: boolean) => void;
  setFont: (font: ReadingFont) => void;
  setTextSize: (size: number) => void;
  setSpacing: (spacing: ReadingSpacing) => void;
  setFocusGuide: (enabled: boolean) => void;
  setAudioSpeed: (speed: ReadingSpeed) => void;
  resetReadingMode: () => void;
  speak: (text: string) => void;
  stopSpeech: () => void;
  pronounce: (word: string) => void;
};

const ReadingModeContext = createContext<ReadingModeContextValue | null>(null);

export function ReadingModeProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<ReadingPreferences>(defaultReadingPreferences);
  const [hydrated, setHydrated] = useState(false);
  const [loadedLocal, setLoadedLocal] = useState(false);
  const [remoteLoaded, setRemoteLoaded] = useState(false);
  const [speech, setSpeech] = useState<SpeechState>({
    text: null,
    activeSentence: -1,
    isSpeaking: false,
    status: "Ready"
  });
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const updatePreferences = useCallback((next: Partial<ReadingPreferences> | ((current: ReadingPreferences) => ReadingPreferences)) => {
    setPreferences((current) => {
      const proposed = typeof next === "function" ? next(current) : { ...current, ...next };
      if (proposed.enabled && !current.enabled && !proposed.hasActivated) {
        return {
          ...proposed,
          font: proposed.font === "standard" ? "open-dyslexic" : proposed.font,
          hasActivated: true
        };
      }
      return proposed;
    });
  }, []);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<ReadingPreferences>;
        setPreferences({
          ...defaultReadingPreferences,
          ...parsed,
          textSize: clampNumber(parsed.textSize, 16, 24, defaultReadingPreferences.textSize),
          audioSpeed: normalizeSpeed(parsed.audioSpeed)
        });
        setLoadedLocal(true);
      }
    } catch {
      setLoadedLocal(false);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    async function loadRemoteSettings() {
      try {
        const response = await fetch("/api/profile");
        const data = (await response.json()) as {
          mode?: string;
          profile?: {
            reading_style?: string;
            font_size?: number;
            line_spacing?: number;
            focus_mode?: boolean;
            audio_speed?: number;
          };
          preferences?: {
            dyslexia_support?: boolean;
          };
        };
        if (!response.ok || !data.profile) return;
        if (data.mode === "demo") return;

        const enabled = Boolean(data.preferences?.dyslexia_support);
        updatePreferences((current) => ({
          ...current,
          enabled,
          font: normalizeReadingFont(data.profile?.reading_style),
          textSize: clampNumber(data.profile?.font_size, 16, 24, current.textSize),
          spacing: normalizeReadingSpacing(data.profile?.line_spacing),
          focusGuide: Boolean(data.profile?.focus_mode),
          audioSpeed: normalizeSpeed(data.profile?.audio_speed),
          hasActivated: current.hasActivated || enabled
        }));
      } catch {
        // Local storage remains the fallback for demo/development mode.
      } finally {
        setRemoteLoaded(true);
      }
    }

    if (hydrated) void loadRemoteSettings();
  }, [hydrated, loadedLocal, updatePreferences]);

  useEffect(() => {
    document.body.classList.toggle("reading-mode-active", preferences.enabled);
    document.documentElement.style.setProperty("--reading-font-family", getReadingFontFamily(preferences.font));
    document.documentElement.style.setProperty("--reading-font-size", `${preferences.textSize}px`);

    const spacing = getReadingSpacing(preferences.spacing);
    document.documentElement.style.setProperty("--reading-line-height", String(spacing.lineHeight));
    document.documentElement.style.setProperty("--reading-letter-spacing", `${spacing.letterSpacing}em`);
    document.documentElement.style.setProperty("--reading-word-spacing", `${spacing.wordSpacing}em`);
    document.documentElement.style.setProperty("--reading-paragraph-gap", spacing.paragraphGap);
    document.documentElement.style.setProperty("--reading-measure", spacing.measure);

    return () => {
      document.body.classList.remove("reading-mode-active");
    };
  }, [preferences]);

  useEffect(() => {
    if (!hydrated || !remoteLoaded) return;

    window.localStorage.setItem(storageKey, JSON.stringify(preferences));
    const saveTimer = window.setTimeout(() => {
      void fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(readingPreferencesToProfilePayload(preferences))
      }).catch(() => {
        // The local copy already preserves the preference when the API is unavailable.
      });
    }, 450);

    return () => window.clearTimeout(saveTimer);
  }, [hydrated, preferences, remoteLoaded]);

  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  const stopSpeech = useCallback(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setSpeech((current) => ({
      ...current,
      activeSentence: -1,
      isSpeaking: false,
      status: "Stopped"
    }));
  }, []);

  const speak = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      if (!("speechSynthesis" in window)) {
        const sentences = splitIntoSentences(trimmed);
        setSpeech({
          text: trimmed,
          activeSentence: sentences.length > 1 ? 0 : -1,
          isSpeaking: false,
          status: "Speech synthesis unavailable"
        });
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(trimmed);
      const sentences = splitIntoSentences(trimmed);
      const sentenceRanges = getSentenceRanges(trimmed, sentences);

      utterance.rate = preferences.audioSpeed;
      utterance.onstart = () => {
        setSpeech({
          text: trimmed,
          activeSentence: sentences.length ? 0 : -1,
          isSpeaking: true,
          status: "Reading aloud"
        });
      };
      utterance.onboundary = (event) => {
        const index = sentenceRanges.findIndex((range) => event.charIndex >= range.start && event.charIndex <= range.end);
        if (index >= 0) {
          setSpeech((current) => ({ ...current, activeSentence: index }));
        }
      };
      utterance.onend = () => {
        setSpeech((current) => ({
          ...current,
          activeSentence: -1,
          isSpeaking: false,
          status: "Finished"
        }));
      };
      utterance.onerror = () => {
        setSpeech((current) => ({
          ...current,
          isSpeaking: false,
          status: "Could not read aloud"
        }));
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [preferences.audioSpeed]
  );

  const pronounce = useCallback((word: string) => {
    if (!word.trim() || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word.trim());
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  }, []);

  const value = useMemo<ReadingModeContextValue>(
    () => ({
      preferences,
      hydrated,
      speech,
      setEnabled: (enabled) => updatePreferences({ enabled }),
      setFont: (font) => updatePreferences({ font, hasActivated: true }),
      setTextSize: (size) => updatePreferences({ textSize: clampNumber(size, 16, 24, preferences.textSize) }),
      setSpacing: (spacing) => updatePreferences({ spacing }),
      setFocusGuide: (enabled) => updatePreferences({ focusGuide: enabled }),
      setAudioSpeed: (speed) => updatePreferences({ audioSpeed: speed }),
      resetReadingMode: () => updatePreferences(defaultReadingPreferences),
      speak,
      stopSpeech,
      pronounce
    }),
    [hydrated, preferences, pronounce, speak, speech, stopSpeech, updatePreferences]
  );

  return (
    <ReadingModeContext.Provider value={value}>
      {children}
      <ReadingFocusGuide enabled={preferences.enabled && preferences.focusGuide} />
    </ReadingModeContext.Provider>
  );
}

export function useReadingMode() {
  const context = useContext(ReadingModeContext);
  if (!context) throw new Error("useReadingMode must be used inside ReadingModeProvider");
  return context;
}

function ReadingFocusGuide({ enabled }: { enabled: boolean }) {
  const [top, setTop] = useState(180);

  useEffect(() => {
    if (!enabled) return;

    setTop(Math.round(window.innerHeight * 0.42));

    function clampTop(nextTop: number) {
      return Math.max(76, Math.min(window.innerHeight - 42, nextTop));
    }

    function moveTo(nextTop: number) {
      setTop(Math.max(76, Math.min(window.innerHeight - 42, nextTop)));
    }

    function handlePointerMove(event: PointerEvent) {
      moveTo(event.clientY);
    }

    function handleFocus(event: FocusEvent) {
      if (!(event.target instanceof HTMLElement)) return;
      const rect = event.target.getBoundingClientRect();
      moveTo(rect.top + rect.height / 2);
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "ArrowDown") setTop((current) => clampTop(current + 30));
      if (event.key === "ArrowUp") setTop((current) => clampTop(current - 30));
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("focusin", handleFocus);
    window.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("focusin", handleFocus);
      window.removeEventListener("keydown", handleKey);
    };
  }, [enabled]);

  if (!enabled) return null;

  return <div aria-hidden="true" className="reading-focus-guide-line" style={{ top }} />;
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function normalizeSpeed(value: unknown): ReadingSpeed {
  if (value === 0.75 || value === 1 || value === 1.25 || value === 1.5) return value;
  if (typeof value === "number") {
    const allowed: ReadingSpeed[] = [0.75, 1, 1.25, 1.5];
    return allowed.reduce((closest, option) =>
      Math.abs(option - value) < Math.abs(closest - value) ? option : closest
    );
  }
  return 1;
}

function getSentenceRanges(text: string, sentences: string[]) {
  let cursor = 0;
  return sentences.map((sentence) => {
    const start = Math.max(0, text.indexOf(sentence, cursor));
    const end = start + sentence.length;
    cursor = end;
    return { start, end };
  });
}
