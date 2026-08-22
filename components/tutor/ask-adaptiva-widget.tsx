"use client";

import { FormEvent, useRef, useState } from "react";
import { MessageCircle, RefreshCcw, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import type { TutorMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

const quickActions = [
  { label: "Explain simply", prompt: "Explain simply: " },
  { label: "Step-by-step", prompt: "Explain step-by-step: " },
  { label: "Summarize", prompt: "Summarize: " },
  { label: "Give an example", prompt: "Give an example of: " }
];

type ChatResponse = {
  reply?: TutorMessage;
  error?: {
    message?: string;
  };
};

export function AskAdaptivaWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function requestReply(nextMessages: TutorMessage[]) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: nextMessages
        })
      });
      const data = (await response.json()) as ChatResponse;

      if (!response.ok || data.reply?.role !== "assistant" || typeof data.reply.content !== "string") {
        throw new Error(data.error?.message ?? "Unable to get an answer right now.");
      }

      setMessages([...nextMessages, data.reply]);
    } catch {
      setError("Ask Adaptiva had trouble answering. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function send(value: string) {
    const prompt = value.trim();
    if (!prompt || loading) return;

    const nextMessages: TutorMessage[] = [...messages, { role: "user", content: prompt }];
    setMessages(nextMessages);
    setInput("");
    void requestReply(nextMessages);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    send(input);
  }

  function handleQuickAction(prompt: string) {
    setInput(prompt);
    inputRef.current?.focus();
  }

  function clearConversation() {
    setMessages([]);
    setInput("");
    setError("");
  }

  return (
    <div className="fixed bottom-4 right-4 z-[70] sm:bottom-6 sm:right-6">
      {open ? (
        <Panel
          as="aside"
          className="flex max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-md flex-col p-0 shadow-lift sm:max-h-[42rem]"
        >
          <div className="flex items-start justify-between gap-3 border-b border-ink/10 p-4">
            <div>
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-moss">
                <Sparkles aria-hidden="true" size={15} />
                Ask Adaptiva
              </p>
              <h2 className="mt-1 text-xl font-black text-ink">Ask Adaptiva</h2>
            </div>
            <button
              type="button"
              className="grid size-10 place-items-center rounded-card text-graphite transition hover:bg-cloud hover:text-ink"
              aria-label="Close Ask Adaptiva"
              onClick={() => setOpen(false)}
            >
              <X aria-hidden="true" size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-paper p-4">
            <div className="rounded-card border border-mint/20 bg-white p-3 text-sm leading-6 text-graphite shadow-sm">
              Hi, I’m Ask Adaptiva. Ask me a learning question, or use a quick action to shape
              the explanation.
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  className="min-h-9 rounded-card border border-ink/10 bg-white px-3 text-xs font-black text-graphite transition hover:border-moss/40 hover:bg-cloud hover:text-ink"
                  onClick={() => handleQuickAction(action.prompt)}
                  disabled={loading}
                >
                  {action.label}
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-3" aria-live="polite">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[86%] whitespace-pre-line rounded-card px-3 py-2 text-sm leading-6 shadow-sm",
                      message.role === "user" ? "bg-ink text-white" : "bg-white text-graphite"
                    )}
                  >
                    {message.role === "assistant" ? (
                      <span className="mb-1 flex items-center gap-2 font-black text-ink">
                        <Sparkles aria-hidden="true" size={14} />
                        Adaptiva
                      </span>
                    ) : null}
                    {message.content}
                  </div>
                </div>
              ))}

              {loading ? (
                <div className="flex justify-start">
                  <div className="rounded-card bg-white px-3 py-2 text-sm font-bold text-graphite shadow-sm">
                    Thinking…
                  </div>
                </div>
              ) : null}

              {error ? (
                <div className="rounded-card border border-coral/20 bg-white p-3 text-sm text-graphite shadow-sm">
                  <p>{error}</p>
                  <Button
                    className="mt-2"
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => requestReply(messages)}
                    disabled={loading || messages.length === 0}
                  >
                    <RefreshCcw aria-hidden="true" size={14} />
                    Try again
                  </Button>
                </div>
              ) : null}
            </div>
          </div>

          <form className="border-t border-ink/10 bg-white p-4" onSubmit={onSubmit}>
            <div className="flex items-center justify-between gap-3">
              <label className="sr-only" htmlFor="ask-adaptiva-input">
                Ask Adaptiva
              </label>
              <button
                type="button"
                className="text-xs font-black text-graphite underline-offset-4 transition hover:text-ink hover:underline disabled:cursor-not-allowed disabled:opacity-55"
                onClick={clearConversation}
                disabled={loading}
              >
                Clear conversation
              </button>
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                ref={inputRef}
                id="ask-adaptiva-input"
                className="min-h-11 flex-1 rounded-card border border-ink/10 bg-white px-3 text-sm text-ink shadow-sm"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask a study question…"
                disabled={loading}
              />
              <Button type="submit" size="sm" disabled={loading || !input.trim()}>
                <Send aria-hidden="true" size={16} />
                {loading ? "Sending" : "Send"}
              </Button>
            </div>
          </form>
        </Panel>
      ) : (
        <Button
          type="button"
          className="shadow-lift"
          onClick={() => {
            setOpen(true);
            window.setTimeout(() => inputRef.current?.focus(), 0);
          }}
        >
          <MessageCircle aria-hidden="true" size={18} />
          Ask Adaptiva
        </Button>
      )}
    </div>
  );
}
