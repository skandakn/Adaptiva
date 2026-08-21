"use client";

import { BookOpenText, Eye, Minus, Plus, Square, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { readingFonts, readingSpacingOptions } from "@/lib/reading-mode";
import type { ReadingSpeed } from "@/lib/reading-mode";
import { cn } from "@/lib/utils";
import { useReadingMode } from "./reading-mode-provider";

const speeds: ReadingSpeed[] = [0.75, 1, 1.25, 1.5];

export function ReadingModeControls({
  textToRead,
  compact = false,
  className
}: {
  textToRead?: string;
  compact?: boolean;
  className?: string;
}) {
  const {
    preferences,
    speech,
    setEnabled,
    setFont,
    setTextSize,
    setSpacing,
    setFocusGuide,
    setAudioSpeed,
    speak,
    stopSpeech
  } = useReadingMode();
  const isReadingThisText = Boolean(textToRead && speech.text === textToRead.trim() && speech.isSpeaking);

  return (
    <section
      className={cn(
        "rounded-card border border-moss/20 bg-white p-4 shadow-sm",
        compact ? "space-y-3" : "space-y-4",
        className
      )}
      aria-label="Reading mode controls"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">Reading Mode</p>
          <p className="mt-1 text-sm font-bold text-graphite">
            Choose the reading format that feels most comfortable for you.
          </p>
        </div>
        <button
          type="button"
          aria-pressed={preferences.enabled}
          aria-label={`Reading Mode ${preferences.enabled ? "ON" : "OFF"}`}
          className={cn(
            "flex min-h-12 items-center gap-3 rounded-card border px-3 text-left transition",
            preferences.enabled
              ? "border-moss bg-mint/14 text-ink"
              : "border-ink/10 bg-paper text-graphite hover:bg-cloud"
          )}
          onClick={() => setEnabled(!preferences.enabled)}
        >
          <span
            aria-hidden="true"
            className={cn(
              "grid size-7 place-items-center rounded-full border text-xs font-black",
              preferences.enabled ? "border-moss bg-moss text-white" : "border-ink/20 bg-white text-graphite"
            )}
          >
            {preferences.enabled ? "ON" : "OFF"}
          </span>
          <span className="text-sm font-black">Reading Mode {preferences.enabled ? "ON" : "OFF"}</span>
        </button>
      </div>

      {preferences.enabled ? (
        <div
          className={cn(
            "grid gap-3",
            compact ? "sm:grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-[1.1fr_1fr_1.2fr_1fr_1.25fr]"
          )}
          role="toolbar"
          aria-label="Reading mode personalization toolbar"
        >
          <label className="grid gap-2 rounded-card border border-ink/10 bg-paper p-3 text-sm font-black text-ink">
            <span className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-graphite">
              <BookOpenText aria-hidden="true" size={15} />
              Font
            </span>
            <select
              className="min-h-11 w-full rounded-card border border-ink/10 bg-white px-3 text-sm font-black"
              value={preferences.font}
              onChange={(event) => setFont(event.target.value as typeof preferences.font)}
            >
              {readingFonts.map((font) => (
                <option key={font.id} value={font.id}>
                  {font.label}
                </option>
              ))}
            </select>
          </label>

          <ControlShell label="Text size">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              aria-label="Decrease reading text size"
              onClick={() => setTextSize(preferences.textSize - 1)}
            >
              <Minus aria-hidden="true" size={17} />
            </Button>
            <span className="min-w-14 text-center text-sm font-black">{preferences.textSize}px</span>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              aria-label="Increase reading text size"
              onClick={() => setTextSize(preferences.textSize + 1)}
            >
              <Plus aria-hidden="true" size={17} />
            </Button>
          </ControlShell>

          <ControlShell label="Spacing">
            <div className="grid w-full grid-cols-3 gap-1" role="group" aria-label="Reading spacing">
              {readingSpacingOptions.map((spacing) => (
                <button
                  key={spacing.id}
                  type="button"
                  aria-pressed={preferences.spacing === spacing.id}
                  className={cn(
                    "min-h-10 rounded-card border px-2 text-xs font-black transition",
                    preferences.spacing === spacing.id
                      ? "border-moss bg-moss text-white"
                      : "border-ink/10 bg-white text-graphite hover:bg-cloud"
                  )}
                  onClick={() => setSpacing(spacing.id)}
                >
                  {spacing.label}
                </button>
              ))}
            </div>
          </ControlShell>

          <ControlShell label="Focus guide">
            <button
              type="button"
              aria-pressed={preferences.focusGuide}
              className={cn(
                "flex min-h-11 w-full items-center justify-center gap-2 rounded-card border px-3 text-sm font-black transition",
                preferences.focusGuide
                  ? "border-moss bg-mint/14 text-ink"
                  : "border-ink/10 bg-white text-graphite hover:bg-cloud"
              )}
              onClick={() => setFocusGuide(!preferences.focusGuide)}
            >
              <Eye aria-hidden="true" size={17} />
              {preferences.focusGuide ? "ON" : "OFF"}
            </button>
          </ControlShell>

          <ControlShell label="Read aloud">
            <div className="grid w-full gap-2">
              <Button
                type="button"
                className="w-full"
                variant={isReadingThisText ? "secondary" : "primary"}
                disabled={!textToRead}
                onClick={() => (isReadingThisText ? stopSpeech() : textToRead ? speak(textToRead) : undefined)}
              >
                {isReadingThisText ? <Square aria-hidden="true" size={17} /> : <Volume2 aria-hidden="true" size={17} />}
                {isReadingThisText ? "Stop" : "Play"}
              </Button>
              <div className="grid grid-cols-4 gap-1" role="group" aria-label="Read aloud speed">
                {speeds.map((speed) => (
                  <button
                    key={speed}
                    type="button"
                    aria-pressed={preferences.audioSpeed === speed}
                    className={cn(
                      "min-h-9 rounded-card border px-1 text-xs font-black transition",
                      preferences.audioSpeed === speed
                        ? "border-moss bg-moss text-white"
                        : "border-ink/10 bg-white text-graphite hover:bg-cloud"
                    )}
                    onClick={() => setAudioSpeed(speed)}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>
          </ControlShell>
        </div>
      ) : null}
    </section>
  );
}

function ControlShell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 rounded-card border border-ink/10 bg-paper p-3">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-graphite">{label}</p>
      <div className="flex min-h-11 items-center gap-2">{children}</div>
    </div>
  );
}
