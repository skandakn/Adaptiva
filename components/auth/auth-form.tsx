"use client";

import { SignIn, SignUp } from "@clerk/nextjs";
import { CheckCircle2, LogIn, ShieldCheck, UserPlus } from "lucide-react";
import Link from "next/link";
import { Panel } from "@/components/ui/panel";

const authAppearance = {
  variables: {
    colorPrimary: "#17342f",
    colorText: "#17211f",
    colorTextSecondary: "#58615e",
    colorBackground: "#ffffff",
    borderRadius: "8px",
    fontFamily: "inherit"
  },
  elements: {
    rootBox: "w-full",
    cardBox: "w-full border-0 shadow-none",
    card: "w-full border-0 p-0 shadow-none",
    headerTitle: "text-2xl font-black text-ink",
    headerSubtitle: "text-sm font-semibold text-graphite",
    formButtonPrimary: "min-h-11 rounded-card bg-ink text-sm font-black hover:bg-moss",
    formFieldInput: "min-h-12 rounded-card border-ink/10 bg-white font-semibold",
    formFieldLabel: "text-sm font-black text-ink",
    footerActionLink: "font-black text-moss",
    identityPreviewEditButton: "font-black text-moss",
    socialButtonsBlockButton: "min-h-11 rounded-card border-ink/10 font-black"
  }
};

const benefits = [
  "Protect saved notes, progress, and private workspaces.",
  "Keep accessibility preferences connected to your account.",
  "Return to video, live lecture, and figure tools securely."
];

export function AuthForm({
  mode,
  nextPath = "/dashboard"
}: {
  mode: "sign-in" | "sign-up";
  nextPath?: string;
}) {
  const isSignIn = mode === "sign-in";
  const encodedNext = encodeURIComponent(nextPath);

  return (
    <div className="mx-auto grid min-h-[calc(100vh-10rem)] max-w-6xl items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
      <section>
        <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">
          {isSignIn ? "Welcome back" : "Create account"}
        </p>
        <h1 className="mt-4 text-balance text-5xl font-black leading-tight text-ink">
          {isSignIn ? "Sign in to your adaptive workspace." : "Save your Adaptiva profile securely."}
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-8 text-graphite">
          Clerk authentication protects the private learning workspace while Adaptiva keeps the same accessible, personalized interface.
        </p>
        <div className="mt-6 grid gap-3">
          {benefits.map((benefit) => (
            <span key={benefit} className="flex items-start gap-3 text-sm font-bold leading-6 text-graphite">
              <CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0 text-moss" size={18} />
              {benefit}
            </span>
          ))}
        </div>
      </section>
      <Panel as="div" className="p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-card bg-mint/14 text-moss">
            {isSignIn ? <LogIn aria-hidden="true" size={20} /> : <UserPlus aria-hidden="true" size={20} />}
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">Secure access</p>
            <p className="text-sm font-bold text-graphite">Powered by Clerk</p>
          </div>
        </div>
        {isSignIn ? (
          <SignIn
            appearance={authAppearance}
            forceRedirectUrl={nextPath}
            path="/auth/sign-in"
            routing="path"
            signUpUrl={`/auth/sign-up?next=${encodedNext}`}
          />
        ) : (
          <SignUp
            appearance={authAppearance}
            forceRedirectUrl={nextPath}
            path="/auth/sign-up"
            routing="path"
            signInUrl={`/auth/sign-in?next=${encodedNext}`}
          />
        )}
        <div className="mt-5 rounded-card bg-cloud p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0 text-moss" size={18} />
            <p className="text-sm font-bold leading-6 text-graphite">
              Already exploring?{" "}
              <Link className="font-black text-moss" href="/onboarding">
                Build your accessibility profile
              </Link>{" "}
              after signing in.
            </p>
          </div>
        </div>
      </Panel>
    </div>
  );
}
