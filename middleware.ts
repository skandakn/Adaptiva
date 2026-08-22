import { createServerClient } from "@supabase/ssr";
import { clerkMiddleware } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { isClerkConfigured, isSupabaseConfigured } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";

const protectedRoutes = ["/dashboard", "/learn", "/progress", "/settings", "/teacher"];

function isProtectedPath(pathname: string) {
  return protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

async function handleSupabaseMiddleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (isProtectedPath(request.nextUrl.pathname) && !user) {
    const signInUrl = request.nextUrl.clone();
    signInUrl.pathname = "/auth/sign-in";
    signInUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  return response;
}

export default clerkMiddleware(async (auth, request) => {
  if (isSupabaseConfigured()) {
    return handleSupabaseMiddleware(request);
  }

  if (isClerkConfigured() && isProtectedPath(request.nextUrl.pathname)) {
    const { userId } = await auth();

    if (!userId) {
      const signInUrl = request.nextUrl.clone();
      signInUrl.pathname = "/auth/sign-in";
      signInUrl.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)"
  ]
};
