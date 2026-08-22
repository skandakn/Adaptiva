import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default async function AuthCallbackPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = params.next ?? "/dashboard";

  return (
    <div className="grid min-h-[calc(100vh-10rem)] place-items-center px-4 py-12">
      <AuthenticateWithRedirectCallback
        signInFallbackRedirectUrl={nextPath}
        signInForceRedirectUrl={nextPath}
        signInUrl="/auth/sign-in"
        signUpFallbackRedirectUrl={nextPath}
        signUpForceRedirectUrl={nextPath}
        signUpUrl="/auth/sign-up"
      />
      <div id="clerk-captcha" />
    </div>
  );
}
