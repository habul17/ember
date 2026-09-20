import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth, availableProviders, signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/wordmark";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage() {
  const session = await auth();
  if (session?.user?.id) redirect("/");

  const nothingConfigured =
    !availableProviders.google && !availableProviders.github && !availableProviders.dev;

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-[22rem] space-y-8">
        <div className="space-y-3">
          <Wordmark />
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
            <p className="text-sm text-muted-foreground">
              Keep the streak alive. Plan a course day by day and tick it off.
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          {availableProviders.google && (
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/" });
              }}
            >
              <Button type="submit" variant="outline" className="h-10 w-full justify-center">
                <GoogleMark />
                Continue with Google
              </Button>
            </form>
          )}

          {availableProviders.github && (
            <form
              action={async () => {
                "use server";
                await signIn("github", { redirectTo: "/" });
              }}
            >
              <Button type="submit" variant="outline" className="h-10 w-full justify-center">
                <GitHubMark />
                Continue with GitHub
              </Button>
            </form>
          )}

          {availableProviders.dev &&
            (availableProviders.google || availableProviders.github) && (
              <div className="flex items-center gap-3 py-1">
                <span className="h-px flex-1 bg-border" />
                <span className="text-[11px] tracking-wide text-muted-foreground uppercase">
                  or
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>
            )}

          {availableProviders.dev && (
            <form
              action={async () => {
                "use server";
                await signIn("dev", { redirectTo: "/" });
              }}
            >
              <Button type="submit" variant="secondary" className="h-10 w-full justify-center">
                Continue as local dev
              </Button>
              <p className="pt-2 text-center text-xs text-muted-foreground">
                Development only — remove DEV_LOGIN before deploying.
              </p>
            </form>
          )}

          {nothingConfigured && (
            <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
              No sign-in method is configured. Add the Google or GitHub credentials to your
              environment, or set DEV_LOGIN=true for local use.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 18 18" className="size-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.93v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.93a9 9 0 0 0 0 8.1l3.04-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .93 4.95l3.04 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}

function GitHubMark() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="currentColor" aria-hidden>
      <path d="M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.38l-.01-1.49c-2.01.37-2.53-.49-2.7-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.42 7.42 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48l-.01 2.2c0 .21.15.46.55.38A8 8 0 0 0 8 0Z" />
    </svg>
  );
}
