"use client";

import { X, Volume2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { splitIntoSentences } from "@/lib/reading-mode";
import { cn } from "@/lib/utils";
import { useReadingMode } from "./reading-mode-provider";

type DifficultWord = {
  word: string;
  syllables: string;
  meaning: string;
};

const difficultWords: Record<string, DifficultWord> = {
  photosynthesis: {
    word: "photosynthesis",
    syllables: "pho-to-syn-the-sis",
    meaning: "The process plants use to make food using light."
  },
  chlorophyll: {
    word: "chlorophyll",
    syllables: "chlo-ro-phyll",
    meaning: "The green pigment in plants that helps capture light."
  },
  biochemical: {
    word: "biochemical",
    syllables: "bio-chem-i-cal",
    meaning: "A chemical process that happens inside living things."
  },
  replication: {
    word: "replication",
    syllables: "rep-li-ca-tion",
    meaning: "The act of making a copy."
  },
  "semi-conservative": {
    word: "semi-conservative",
    syllables: "sem-i con-ser-va-tive",
    meaning: "Each new DNA molecule keeps one old strand and gets one new strand."
  },
  molecule: {
    word: "molecule",
    syllables: "mol-e-cule",
    meaning: "A tiny group of atoms joined together."
  },
  enzyme: {
    word: "enzyme",
    syllables: "en-zyme",
    meaning: "A protein that helps a reaction happen faster in a living thing."
  },
  enzymes: {
    word: "enzymes",
    syllables: "en-zymes",
    meaning: "Proteins that help reactions happen faster in living things."
  },
  helicase: {
    word: "helicase",
    syllables: "hel-i-case",
    meaning: "An enzyme that opens the DNA double helix."
  },
  primase: {
    word: "primase",
    syllables: "pri-mase",
    meaning: "An enzyme that starts a new DNA strand with a short primer."
  },
  polymerase: {
    word: "polymerase",
    syllables: "po-ly-mer-ase",
    meaning: "An enzyme that adds matching bases to build a DNA strand."
  },
  ligase: {
    word: "ligase",
    syllables: "li-gase",
    meaning: "An enzyme that seals small gaps in DNA."
  },
  template: {
    word: "template",
    syllables: "tem-plate",
    meaning: "A guide used to build something matching."
  },
  complementary: {
    word: "complementary",
    syllables: "com-ple-men-ta-ry",
    meaning: "Matching in a way that fits together."
  },
  genetic: {
    word: "genetic",
    syllables: "ge-net-ic",
    meaning: "Related to inherited instructions in DNA."
  }
};

export function ReadingContent({
  text,
  className,
  label = "Reading content"
}: {
  text: string;
  className?: string;
  label?: string;
}) {
  const { preferences, speech, pronounce } = useReadingMode();
  const [selectedWord, setSelectedWord] = useState<DifficultWord | null>(null);
  const paragraphs = useMemo(() => splitParagraphs(text), [text]);
  const activeText = speech.text === text.trim() ? speech.activeSentence : -1;
  let sentenceCursor = -1;

  function handleSelection() {
    if (!preferences.enabled) return;
    const selection = window.getSelection()?.toString().trim();
    if (!selection || selection.length < 3) return;
    const word = selection.split(/\s+/)[0]?.replace(/[^\w-]/g, "");
    if (word) setSelectedWord(getWordSupport(word));
  }

  return (
    <div
      className={cn("reading-content whitespace-pre-line text-wrap", className)}
      aria-label={label}
      onMouseUp={handleSelection}
      onKeyUp={handleSelection}
    >
      {paragraphs.map((paragraph, paragraphIndex) => {
        const sentences = splitIntoSentences(paragraph);
        return (
          <p key={`${paragraph.slice(0, 24)}-${paragraphIndex}`} className="reading-paragraph">
            {sentences.map((sentence) => {
              sentenceCursor += 1;
              const isActive = sentenceCursor === activeText;
              return (
                <span
                  key={`${sentence}-${sentenceCursor}`}
                  className={cn("reading-sentence", isActive && "reading-sentence-active")}
                >
                  {renderSentence(sentence, preferences.enabled, setSelectedWord)}
                </span>
              );
            })}
          </p>
        );
      })}

      {selectedWord ? (
        <div
          className="mt-4 rounded-card border border-moss/25 bg-white p-4 shadow-soft"
          role="dialog"
          aria-label={`Word support for ${selectedWord.word}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">Word</p>
              <p className="mt-1 text-xl font-black text-ink">{selectedWord.word}</p>
            </div>
            <button
              type="button"
              className="grid size-10 place-items-center rounded-card border border-ink/10 bg-paper text-ink"
              aria-label="Close word support"
              onClick={() => setSelectedWord(null)}
            >
              <X aria-hidden="true" size={17} />
            </button>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <WordSupportItem label="Syllables" value={selectedWord.syllables} />
            <WordSupportItem label="Meaning" value={selectedWord.meaning} />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-graphite">Pronunciation</p>
              <Button className="mt-2" type="button" variant="secondary" onClick={() => pronounce(selectedWord.word)}>
                <Volume2 aria-hidden="true" size={17} />
                Listen
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function renderSentence(
  sentence: string,
  interactiveWords: boolean,
  setSelectedWord: (word: DifficultWord) => void
) {
  const parts = sentence.split(/(\b[\w-]+\b)/g);

  return parts.map((part, index) => {
    const normalized = normalizeWord(part);
    const wordSupport = normalized ? difficultWords[normalized] : undefined;
    if (!interactiveWords || !wordSupport) return <span key={`${part}-${index}`}>{part}</span>;

    return (
      <button
        key={`${part}-${index}`}
        type="button"
        className="difficult-word"
        aria-label={`Explain difficult word ${part}`}
        onClick={() => setSelectedWord(wordSupport)}
      >
        {part}
      </button>
    );
  });
}

function splitParagraphs(text: string) {
  return text
    .trim()
    .split(/\n{2,}|\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function normalizeWord(word: string) {
  return word.toLowerCase().replace(/(^[^\w-]+|[^\w-]+$)/g, "");
}

function getWordSupport(word: string): DifficultWord {
  const normalized = normalizeWord(word);
  return (
    difficultWords[normalized] ?? {
      word,
      syllables: word.length > 7 ? word.replace(/([aeiouy])/gi, "$1-").replace(/-$/, "") : word,
      meaning: "Adaptiva can connect this word to an AI explanation later. Demo biology terms include definitions now."
    }
  );
}

function WordSupportItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.12em] text-graphite">{label}</p>
      <p className="mt-2 text-sm font-bold leading-6 text-ink">{value}</p>
    </div>
  );
}
