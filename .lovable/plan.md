# Tapaura → Vercel + your own Supabase

## Important first: rotate that secret key

You pasted your Supabase **service_role / secret key** into chat. Treat it as compromised.
In your Supabase project go to Project Settings → API Keys and **rotate the secret key**, then use the new value only inside Vercel's environment variables. Never put it in the repo or in chat.

The service key is also **not needed in the browser** — only in Vercel server-side env vars.

## What I will update in the repo

1. `.env.example` — point the placeholder values at your project (`uufddanpukimuyahglxz`), and make clear the secret key is Vercel-only.
2. `VERCEL_DEPLOY.md` — rewrite with your real values baked in:
   - Supabase URL `https://uufddanpukimuyahglxz.supabase.co`, project ID `uufddanpukimuyahglxz`
   - GitHub repo `krrishvibecoder/tapaura`
   - Current Vercel URL `tapaura-git-main-krrishpurohit23-3817s-projects.vercel.app`
   - Final domain `tapaura.boostinsta.co.in`
   - Exact Google OAuth origins + redirect URIs to paste (both the Vercel URL and the custom domain, plus the Supabase callback `https://uufddanpukimuyahglxz.supabase.co/auth/v1/callback`)
   - Supabase Auth → URL Configuration: Site URL + redirect allow-list entries
   - A rotate-the-key warning at the top
3. `.gitignore` — ensure `.env` is ignored, plus the note to run `git rm --cached .env` once.
4. Verify `vercel.json` rewrites and `vite.config.ts` (`nitro: { preset: "vercel" }`) are correct for `/bookstore`-style slug links on refresh.

No app logic changes — auth already uses standard `supabase.auth.signInWithOAuth`.

## What you do (I can't do these for you)

1. Rotate the secret key in Supabase.
2. Run `tapaura_bootstrap.sql` in your new project's SQL Editor.
3. Create the Google OAuth client and paste ID/secret into Supabase Auth → Providers → Google.
4. Add the env vars in Vercel (list will be in the guide) and redeploy.
5. Add `tapaura.boostinsta.co.in` in Vercel Domains and set the DNS record.

## Technical notes

- Public pages (`/$slug`) stay SSR for SEO; dashboard stays behind the `_authenticated` gate.
- Only `VITE_*` values reach the browser; `SUPABASE_SERVICE_ROLE_KEY` stays server-only.
- Slug routing on Vercel works via the existing `vercel.json` rewrite, so direct visits and refreshes on `/bookstore` resolve correctly.
