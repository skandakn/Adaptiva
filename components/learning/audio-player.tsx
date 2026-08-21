"use client";

import { Pause, Play, Square } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/utils";

const speeds = [0.75, 1, 1.25, 1.5];

export function AudioPlayer({ text }: { text: string }) {
  const [speed, setSpeed] = useState(1);
  const [activeSentence, setActiveSentence] = useState(0);
  const [status, setStatus] = useState("Ready");
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const sentences = useMemo(() => text.match(/[^.!?]+[.!?]+/g) ?? [text], [text]);

  function play() {
    if (!("speechSynthesis" in window)) {
      setStatus("Browser speech synthesis is unavailable. Demo highlighting is active.");
      setActiveSentence((value) => (value + 1) % sentences.length);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speed;
    utterance.onboundary = (event) => {
      const index = sentences.findIndex((sentence) => event.charIndex < text.indexOf(sentence) + sentence.length);
      if (index >= 0) {
        setActiveSentence(index);
      }
    };
    utterance.onend = () => setStatus("Finished");
    utteranceRef.current = utterance;
    setStatus("Reading aloud");
    window.speechSynthesis.speak(utterance);
  }

  function pause() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.pause();
    }
    setStatus("Paused");
  }

  function stop() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    utteranceRef.current = null;
    setActiveSentence(0);
    setStatus("Stopped");
  }

  return (
    <Panel>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">Audio Mode</p>
          <h3 className="mt-2 text-2xl font-black text-ink">Read aloud with sentence focus</h3>
        </div>
        <p className="rounded-card bg-cloud px-3 py-2 text-sm font-black text-moss">{status}</p>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button type="button" onClick={play}>
          <Play aria-hidden="true" size={18} />
          Play
        </Button>
        <Button type="button" variant="secondary" onClick={pause}>
          <Pause aria-hidden="true" size={18} />
          Pause
        </Button>
        <Button type="button" variant="secondary" onClick={stop}>
          <Square aria-hidden="true" size={18} />
          Stop
        </Button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Speech speed">
        {speeds.map((value) => (
          <button
            key={value}
            type="button"
            className={cn(
              "min-h-10 rounded-card border px-3 text-sm font-black",
              speed === value ? "border-moss bg-moss text-white" : "border-ink/10 bg-white text-graphite"
            )}
            onClick={() => setSpeed(value)}
          >
            {value}x
          </button>
        ))}
      </div>
      <div className="mt-5 space-y-2 rounded-card bg-paper p-4">
        {sentences.map((sentence, index) => (
          <p
            key={`${sentence}-${index}`}
            className={cn(
              "rounded-card px-3 py-2 text-lg leading-8 transition",
              activeSentence === index ? "bg-amber/25 text-ink" : "text-graphite"
            )}
          >
            {sentence.trim()}
          </p>
        ))}
      </div>
    </Panel>
  );
}
