# Fix Google sign-in on Vercel

## What the error means

`validation_failed — Unsupported provider: missing OAuth secret` comes from your own
Supabase project, not from the app code. It means the Google provider in that project has
no Client ID / Client Secret saved, so Supabase refuses to start the OAuth flow.

The app code is already correct: `src/routes/auth.tsx` calls standard
`supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } })`.
No code change is required for this error.

## What you need to do (Google Cloud Console)

1. APIs & Services → OAuth consent screen: External, app name Tapaura, add scopes
   `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`. Add yourself as a test
   user, or publish the app.
2. APIs & Services → Credentials → Create credentials → OAuth client ID → Web application.
3. Authorized JavaScript origins:
   - `https://tapaura.boostinsta.co.in`
   - `https://tapaura-git-main-krrishpurohit23-3817s-projects.vercel.app`
   - `http://localhost:8080`
4. Authorized redirect URIs (Supabase callback, not your site):
   - `https://uufddanpukimuyahglxz.supabase.co/auth/v1/callback`
5. Copy the Client ID and Client Secret.

## What you need to do (your Supabase project)

1. Authentication → Providers → Google → enable, paste Client ID + Client Secret, save.
2. Authentication → URL Configuration:
   - Site URL: `https://tapaura.boostinsta.co.in`
   - Redirect URLs: the domain, the Vercel URL, and `http://localhost:8080`, each also with `/**`.

Sign-in starts working immediately after saving — no redeploy needed.

## What I will change in the repo

1. `VERCEL_DEPLOY.md` — add a short "Troubleshooting Google sign-in" section mapping the
   exact error strings to their cause:
   - `Unsupported provider: missing OAuth secret` → provider not enabled / secret missing in Supabase
   - `redirect_uri_mismatch` → Supabase callback URL missing in Google Console
   - lands back on sign-in with no session → origin missing from Supabase redirect allow-list
2. `src/routes/auth.tsx` — surface the real provider error text instead of the generic
   "Google sign-in failed. Please try again.", so misconfiguration is visible in one glance.

## Technical notes

- Nothing in the OAuth chain runs through Lovable's managed broker anymore, so the provider
  credentials must live in your own Supabase project.
- `redirectTo: window.location.origin` means every origin you use (custom domain, Vercel URL,
  localhost) must be listed in the Supabase redirect allow-list.
