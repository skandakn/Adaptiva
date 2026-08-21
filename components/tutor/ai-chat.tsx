"use client";

import { Send, Sparkles } from "lucide-react";
import { FormEvent, useState } from "react";
import { ReadingContent } from "@/components/reading/reading-content";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { featuredLesson, tutorConversation } from "@/lib/demo-data";
import type { TutorMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

const prompts = [
  "Explain this like I am new to the topic.",
  "Give me an example.",
  "Break this into steps.",
  "Quiz me.",
  "Make a mind map.",
  "Explain this in simpler English."
];

export function AIChat() {
  const [messages, setMessages] = useState<TutorMessage[]>(tutorConversation);
  const [input, setInput] = useState("");

  function answerFor(prompt: string) {
    const lower = prompt.toLowerCase();
    if (lower.includes("quiz")) {
      return featuredLesson.quiz.map((item) => `${item.question} Answer: ${item.answer}`).join("\n\n");
    }
    if (lower.includes("step")) {
      return featuredLesson.stepByStep.map((step, index) => `Step ${index + 1}: ${step}`).join("\n");
    }
    if (lower.includes("mind")) {
      return "DNA Replication -> DNA opens -> matching bases are added -> two complete DNA copies form.";
    }
    return "DNA replication is the cell's way of copying its instruction book before division. The process becomes clearer when you see it as opening, matching, sealing, and checking.";
  }

  function send(value: string) {
    const prompt = value.trim();
    if (!prompt) return;
    setMessages((current) => [
      ...current,
      { role: "user", content: prompt },
      { role: "assistant", content: answerFor(prompt) }
    ]);
    setInput("");
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    send(input);
  }

  return (
    <Panel className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">Ask Adaptiva</p>
          <h1 className="mt-2 text-4xl font-black text-ink">Context-aware AI tutor</h1>
        </div>
        <span className="rounded-card bg-mint/14 px-3 py-2 text-sm font-black text-moss">
          Studying: {featuredLesson.title}
        </span>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        {prompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="min-h-10 rounded-card border border-ink/10 bg-paper px-3 text-sm font-black text-graphite transition hover:border-moss/40 hover:bg-cloud hover:text-ink"
            onClick={() => send(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>
      <div className="mt-6 max-h-[34rem] space-y-4 overflow-y-auto rounded-card bg-paper p-4">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[82%] whitespace-pre-line rounded-card p-4 text-sm leading-7",
                message.role === "user" ? "bg-ink text-white" : "bg-white text-graphite shadow-sm"
              )}
            >
              {message.role === "assistant" ? (
                <span className="mb-2 flex items-center gap-2 font-black text-ink">
                  <Sparkles aria-hidden="true" size={16} />
                  Adaptiva
                </span>
              ) : null}
              <ReadingContent text={message.content} />
            </div>
          </div>
        ))}
      </div>
      <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={onSubmit}>
        <label className="sr-only" htmlFor="tutor-input">
          Ask Adaptiva
        </label>
        <input
          id="tutor-input"
          className="min-h-12 flex-1 rounded-card border border-ink/10 bg-white px-4 text-ink shadow-sm"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask for a simpler explanation, example, quiz, or step-by-step guide"
        />
        <Button type="submit">
          <Send aria-hidden="true" size={18} />
          Send
        </Button>
      </form>
    </Panel>
  );
}
