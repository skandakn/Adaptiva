"use client";

import { BookOpenText, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ReadingModeControls } from "./reading-mode-controls";
import { useReadingMode } from "./reading-mode-provider";

const sampleReadText =
  "Adaptiva keeps Reading Mode available everywhere. Learning content uses the selected reading format, while navigation and controls stay stable.";

export function ReadingModeQuickControl({ className }: { className?: string }) {
  const { preferences } = useReadingMode();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    }

    window.addEventListener("keydown", handleKey);
    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  return (
    <div className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls="global-reading-mode-panel"
        aria-label={`Global Reading Mode ${preferences.enabled ? "ON" : "OFF"}`}
        className={cn(
          "flex min-h-11 items-center gap-2 rounded-card border px-3 text-sm font-black transition",
          preferences.enabled
            ? "border-moss bg-mint/14 text-ink"
            : "border-ink/10 bg-white text-graphite hover:bg-cloud hover:text-ink"
        )}
        onClick={() => setOpen((value) => !value)}
      >
        <BookOpenText aria-hidden="true" size={18} />
        <span className="hidden sm:inline">Reading</span>
        <span className="rounded-full bg-paper px-2 py-1 text-[0.68rem] uppercase tracking-[0.08em]">
          {preferences.enabled ? "ON" : "OFF"}
        </span>
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-[60] bg-ink/8 sm:hidden" aria-hidden="true" />
          <div
            ref={panelRef}
            id="global-reading-mode-panel"
            className="fixed inset-x-3 bottom-3 z-[70] max-h-[82vh] overflow-y-auto rounded-card border border-ink/10 bg-white p-3 shadow-lift sm:absolute sm:inset-auto sm:right-0 sm:top-[calc(100%+0.75rem)] sm:w-[34rem]"
            role="dialog"
            aria-label="Global Reading Mode controls"
          >
            <div className="mb-2 flex items-center justify-between gap-3 sm:hidden">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">Global Accessibility</p>
              <button
                type="button"
                className="grid size-10 place-items-center rounded-card border border-ink/10 bg-paper text-ink"
                aria-label="Close Reading Mode controls"
                onClick={() => setOpen(false)}
              >
                <X aria-hidden="true" size={17} />
              </button>
            </div>
            <ReadingModeControls compact textToRead={sampleReadText} className="border-0 p-1 shadow-none" />
          </div>
        </>
      ) : null}
    </div>
  );
}
