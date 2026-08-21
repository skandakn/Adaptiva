export const demoUserId = "00000000-0000-0000-0000-000000000001";

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function isExplicitDemoMode() {
  return process.env.NEXT_PUBLIC_ADAPTIVA_DEMO_MODE === "true";
}

export function canUseDevelopmentFallback() {
  return !isSupabaseConfigured() && (process.env.NODE_ENV !== "production" || isExplicitDemoMode());
}

export function persistenceMode() {
  if (isSupabaseConfigured()) {
    return "supabase" as const;
  }
  if (canUseDevelopmentFallback()) {
    return "demo" as const;
  }
  return "unavailable" as const;
}
