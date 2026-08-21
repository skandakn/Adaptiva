"use client";

import { Languages, Mic, MicOff, Save, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ReadingContent } from "@/components/reading/reading-content";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { featuredLesson } from "@/lib/demo-data";
import type { ContentLanguage } from "@/lib/types";
import { cn } from "@/lib/utils";

type SpeechRecognitionResultLike = {
  0: { transcript: string };
  isFinal: boolean;
};

type SpeechRecognitionEventLike = {
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const adaptiveModes = {
  simple: {
    label: "Simple words",
    title: "Simple explanation",
    text: "DNA is like an instruction manual for living cells. Before a cell divides, DNA makes a copy of itself."
  },
  steps: {
    label: "Step-by-step",
    title: "Step-by-step explanation",
    steps: [
      "DNA opens into two strands.",
      "Each strand is used as a template.",
      "New matching strands are created.",
      "Two copies of DNA are formed."
    ]
  },
  visual: {
    label: "Visual",
    title: "Visual explanation",
    text: "🧬 DNA → 🔓 DNA opens → 🧩 New strands are built → 🧬 Two DNA copies"
  }
} as const;

type AdaptiveMode = keyof typeof adaptiveModes;

const liveLanguages: Array<{ label: ContentLanguage; locale: string; demoTranscript: string[] }> = [
  {
    label: "English",
    locale: "en-US",
    demoTranscript: featuredLesson.transcript.map((item) => item.text)
  },
  {
    label: "Kannada",
    locale: "kn-IN",
    demoTranscript: [
      "ಡಿಎನ್‌ಎ ಜೀವಕೋಶಗಳ ಸೂಚನಾ ಪುಸ್ತಕದಂತಿದೆ.",
      "ಕೋಶ ವಿಭಜನೆಯ ಮೊದಲು ಡಿಎನ್‌ಎ ತನ್ನ ಪ್ರತಿಯನ್ನು ಮಾಡುತ್ತದೆ.",
      "ಹೆಲಿಕೇಸ್ ಡಿಎನ್‌ಎಯನ್ನು ತೆರೆಯುತ್ತದೆ ಮತ್ತು ಪಾಲಿಮರೇಸ್ ಹೊಸ ಸರಪಳಿಗಳನ್ನು ನಿರ್ಮಿಸುತ್ತದೆ.",
      "ಕೊನೆಯಲ್ಲಿ ಎರಡು ಒಂದೇ ರೀತಿಯ ಡಿಎನ್‌ಎ ಪ್ರತಿಗಳು ರೂಪುಗೊಳ್ಳುತ್ತವೆ."
    ]
  },
  {
    label: "Hindi",
    locale: "hi-IN",
    demoTranscript: [
      "डीएनए जीवित कोशिकाओं की निर्देश पुस्तिका जैसा है।",
      "कोशिका विभाजन से पहले डीएनए अपनी प्रतिलिपि बनाता है।",
      "हेलिकेस डीएनए को खोलता है और पॉलीमरेज़ नई श्रृंखलाएँ बनाता है।",
      "अंत में डीएनए की दो समान प्रतियाँ बनती हैं।"
    ]
  }
];

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export function LiveTranscript() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState(featuredLesson.transcript[0].text);
  const [noteSaved, setNoteSaved] = useState(false);
  const [message, setMessage] = useState("Ready for microphone or demo mode.");
  const [adaptiveMode, setAdaptiveMode] = useState<AdaptiveMode>("simple");
  const [language, setLanguage] = useState<ContentLanguage>("English");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const liveLanguage = liveLanguages.find((item) => item.label === language) ?? liveLanguages[0];
  const langCode = language === "Kannada" ? "kn" : language === "Hindi" ? "hi" : "en";

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  function changeLanguage(nextLanguage: ContentLanguage) {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
    }
    const next = liveLanguages.find((item) => item.label === nextLanguage) ?? liveLanguages[0];
    setLanguage(next.label);
    setTranscript(next.demoTranscript[0] ?? "");
    setNoteSaved(false);
    setMessage(`Ready to listen in ${next.label}.`);
  }

  function start() {
    const SpeechRecognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    setNoteSaved(false);
    if (!SpeechRecognition) {
      setListening(true);
      setMessage("Speech recognition is unavailable here, so demo lecture mode is running.");
      let index = 0;
      const timer = window.setInterval(() => {
        index += 1;
        setTranscript((current) => `${current} ${liveLanguage.demoTranscript[index % liveLanguage.demoTranscript.length]}`);
        if (index > 3) {
          window.clearInterval(timer);
          setListening(false);
          setMessage("Demo transcript captured.");
        }
      }, 900);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = liveLanguage.locale;
    recognition.onresult = (event) => {
      const text = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join(" ");
      setTranscript(text);
    };
    recognition.onerror = () => {
      setListening(false);
      setMessage("Microphone transcription stopped. Demo notes remain available.");
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    setMessage(`Listening through the device microphone in ${liveLanguage.label}.`);
  }

  function stop() {
    recognitionRef.current?.stop();
    setListening(false);
    setMessage("Listening stopped.");
  }

  async function saveLectureNote() {
    try {
      const response = await fetch("/api/live-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "DNA live lecture",
          transcript,
          notes: "Key concept: DNA contains genetic information. Simple explanation: DNA is like an instruction manual for living cells.",
          save_material: true
        })
      });
      if (!response.ok) throw new Error("Save failed");
      setNoteSaved(true);
      setMessage("Lecture transcript and accessible notes saved.");
    } catch {
      setMessage("Could not save lecture notes to persistence. Transcript remains available.");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">Live Lecture</p>
            <h1 className="mt-2 text-4xl font-black text-ink">Microphone to accessible notes</h1>
          </div>
          <span
            className={cn(
              "flex items-center gap-2 rounded-card px-3 py-2 text-sm font-black",
              listening ? "bg-coral/14 text-coral" : "bg-cloud text-moss"
            )}
          >
            <span className={cn("size-2 rounded-full", listening ? "animate-pulse bg-coral" : "bg-moss")} />
            {listening ? "Listening" : "Ready"}
          </span>
        </div>
        <div className="mt-6 grid place-items-center rounded-card bg-paper p-8">
          <div className="flex h-32 items-end gap-2" aria-hidden="true">
            {Array.from({ length: 18 }).map((_, index) => (
              <span
                key={index}
                className={cn("w-2 rounded-full bg-mint", listening && "animate-pulse")}
                style={{ height: `${24 + ((index * 13) % 78)}px`, animationDelay: `${index * 55}ms` }}
              />
            ))}
          </div>
        </div>
        <p className="mt-4 text-sm font-bold text-graphite">{message}</p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <label className="inline-flex min-h-11 items-center gap-2 rounded-card border border-ink/12 bg-white px-3 py-2 text-sm font-black text-ink shadow-sm">
            <Languages aria-hidden="true" size={18} />
            <span className="sr-only">Live microphone language</span>
            <select
              value={language}
              onChange={(event) => changeLanguage(event.target.value as ContentLanguage)}
              className="bg-transparent text-sm font-black outline-none"
              aria-label="Live microphone language"
            >
              {liveLanguages.map((item) => (
                <option key={item.label} value={item.label}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <Button type="button" onClick={start} disabled={listening}>
            <Mic aria-hidden="true" size={18} />
            Start Listening
          </Button>
          <Button type="button" variant="secondary" onClick={stop}>
            <MicOff aria-hidden="true" size={18} />
            Stop
          </Button>
        </div>
        <section className="mt-6 rounded-card border border-ink/10 bg-white p-4">
          <h2 className="text-lg font-black text-ink">Live transcript</h2>
          <div lang={langCode}>
            <ReadingContent className="mt-3 min-h-32 text-lg leading-9 text-graphite" text={transcript} />
          </div>
        </section>
      </Panel>
      <Panel>
        <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">Live AI Notes</p>
        <h2 className="mt-2 text-3xl font-black text-ink">DNA contains genetic information</h2>
        <div className="mt-5 space-y-4">
          <NoteBlock title="Simple explanation" body="DNA is like an instruction manual for living cells. Replication makes a clean copy before the cell divides." />
          <NoteBlock title="Important terms" body="DNA, chromosome, gene, helicase, DNA polymerase." />
          <AdaptiveExplanation mode={adaptiveMode} onModeChange={setAdaptiveMode} />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="button" variant="secondary" onClick={() => setTranscript(featuredLesson.simplified)}>
            <Sparkles aria-hidden="true" size={18} />
            Simplify
          </Button>
          <Button type="button" onClick={() => void saveLectureNote()}>
            <Save aria-hidden="true" size={18} />
            Save Note
          </Button>
        </div>
        <p className="mt-4 min-h-6 text-sm font-bold text-moss">
          {noteSaved ? "Lecture note saved in demo mode." : "Notes update as transcript content changes."}
        </p>
      </Panel>
    </div>
  );
}

function AdaptiveExplanation({
  mode,
  onModeChange
}: {
  mode: AdaptiveMode;
  onModeChange: (mode: AdaptiveMode) => void;
}) {
  const explanation = adaptiveModes[mode];

  return (
    <section className="rounded-card bg-paper p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">Adaptive explanation</p>
      <h3 className="mt-2 font-black text-ink">This concept may be difficult</h3>
      <p className="mt-3 inline-flex rounded-card bg-coral/14 px-3 py-2 text-sm font-black text-coral">
        ⚠ Complex concept detected
      </p>
      <ReadingContent
        className="mt-3 text-sm leading-7 text-graphite"
        text="DNA replication contains several technical terms. Adaptiva recommends changing the explanation style."
      />

      <div className="mt-4 rounded-card border border-ink/10 bg-white p-4">
        <h4 className="font-black text-ink">🧠 Why did Adaptiva adapt this?</h4>
        <ReadingContent
          className="mt-2 text-sm leading-7 text-graphite"
          text="This topic contains unfamiliar scientific terms, so Adaptiva is offering simpler ways to understand it."
        />
      </div>

      <fieldset className="mt-4">
        <legend className="font-black text-ink">How would you like to learn it?</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {(Object.keys(adaptiveModes) as AdaptiveMode[]).map((key) => {
            const selected = mode === key;

            return (
              <Button
                key={key}
                type="button"
                size="sm"
                variant={selected ? "primary" : "secondary"}
                aria-pressed={selected}
                onClick={() => onModeChange(key)}
                className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                {adaptiveModes[key].label}
                {selected && <span aria-hidden="true">✓ Selected</span>}
              </Button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-4 rounded-card border border-ink/10 bg-white p-4" aria-live="polite">
        <h4 className="font-black text-ink">{explanation.title}</h4>
        {"steps" in explanation ? (
          <ol className="reading-content mt-2 list-decimal space-y-1 pl-5 text-sm leading-7 text-graphite">
            {explanation.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        ) : (
          <ReadingContent className="mt-2 text-sm leading-7 text-graphite" text={explanation.text} />
        )}
      </div>
    </section>
  );
}

function NoteBlock({ title, body }: { title: string; body: string }) {
  return (
    <section className="rounded-card bg-paper p-4">
      <h3 className="font-black text-ink">{title}</h3>
      <ReadingContent className="mt-2 text-sm leading-7 text-graphite" text={body} />
    </section>
  );
}
