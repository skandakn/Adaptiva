"use client";

import { LogIn, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";

export function AuthForm({
  mode,
  nextPath = "/dashboard"
}: {
  mode: "sign-in" | "sign-up";
  nextPath?: string;
}) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    if (!supabase) {
      setMessage("Supabase is not configured. Local demo mode is available for development.");
      setLoading(false);
      return;
    }

    const result =
      mode === "sign-in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`
            }
          });

    setLoading(false);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    if (mode === "sign-up" && !result.data.session) {
      setMessage("Account created. Check your email if confirmation is enabled in Supabase.");
      return;
    }

    router.push(nextPath);
    router.refresh();
  }

  return (
    <div className="mx-auto grid min-h-[calc(100vh-10rem)] max-w-6xl items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
      <section>
        <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">
          {mode === "sign-in" ? "Welcome back" : "Create account"}
        </p>
        <h1 className="mt-4 text-balance text-5xl font-black leading-tight text-ink">
          {mode === "sign-in" ? "Sign in to your adaptive workspace." : "Save your Adaptiva profile securely."}
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-8 text-graphite">
          Supabase Auth protects private learning materials, saved notes, settings, and progress.
        </p>
      </section>
      <Panel>
        <form className="grid gap-4" onSubmit={submit}>
          <label className="grid gap-2 text-sm font-black text-ink">
            Email
            <input
              className="min-h-12 rounded-card border border-ink/10 bg-white px-4 font-medium"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-black text-ink">
            Password
            <input
              className="min-h-12 rounded-card border border-ink/10 bg-white px-4 font-medium"
              type="password"
              autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          <Button type="submit" disabled={loading}>
            {mode === "sign-in" ? <LogIn aria-hidden="true" size={18} /> : <UserPlus aria-hidden="true" size={18} />}
            {loading ? "Working..." : mode === "sign-in" ? "Sign in" : "Sign up"}
          </Button>
        </form>
        {message ? (
          <p className="mt-4 rounded-card bg-cloud p-3 text-sm font-bold text-graphite">{message}</p>
        ) : null}
        {!supabase ? (
          <Button className="mt-4 w-full" variant="secondary" asChild>
            <Link href="/dashboard">Continue in local demo mode</Link>
          </Button>
        ) : null}
        <p className="mt-5 text-sm text-graphite">
          {mode === "sign-in" ? "Need an account?" : "Already have an account?"}{" "}
          <Link
            className="font-black text-moss"
            href={mode === "sign-in" ? `/auth/sign-up?next=${nextPath}` : `/auth/sign-in?next=${nextPath}`}
          >
            {mode === "sign-in" ? "Sign up" : "Sign in"}
          </Link>
        </p>
      </Panel>
    </div>
  );
}
