# Tapaura — Vercel + Self-hosted Supabase deployment guide

This project was originally built on Lovable Cloud. This guide walks you through moving the whole app to **Vercel** with your own **Supabase** backend and the custom domain `tapaura.boostinsta.co.in`.

## 1. Create your own Supabase project

1. Go to https://supabase.com and create a new project.
2. Once it is ready, open the **Project Settings → API** page.
3. Copy these values:
   - `Project URL` (e.g. `https://xxxxx.supabase.co`)
   - `Project API keys` → `anon public` key
   - `Project API keys` → `service_role` secret key

4. Go to **SQL Editor → New query**, paste the entire contents of `tapaura_bootstrap.sql` from this repo, and run it.
5. Go to **Storage → Buckets** and confirm that `client-logos` exists (private, 5 MB limit).

## 2. Set up Google sign-in

1. In Supabase, go to **Authentication → Providers → Google**.
2. Enable Google.
3. Open the Google Cloud Console → **APIs & Services → Credentials**.
4. Create an **OAuth 2.0 Web application** credential.
5. Add these **Authorized JavaScript origins**:
   - `https://tapaura.boostinsta.co.in`
   - `http://localhost:3000` (for local testing)
6. Add these **Authorized redirect URIs**:
   - `https://tapaura.boostinsta.co.in/auth/callback`
   - `http://localhost:3000/auth/callback`
   - Copy the exact callback URL shown in Supabase Auth → Google → `Callback URL (for OAuth)` and add it too.
7. Copy the Google Client ID and Secret into Supabase Auth → Google.
8. Save.

## 3. Environment variables on Vercel

Add these environment variables in your Vercel project settings:

| Name | Value | Example |
|------|-------|---------|
| `SUPABASE_URL` | Your Supabase project URL | `https://xxxxx.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | Your Supabase `anon public` key | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase `service_role` secret key | `eyJ...` |
| `SUPABASE_PROJECT_ID` | Your Supabase project ID | `xxxxx` |
| `VITE_SUPABASE_URL` | Same as `SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Same as `SUPABASE_PUBLISHABLE_KEY` | `eyJ...` |
| `VITE_SUPABASE_PROJECT_ID` | Same as `SUPABASE_PROJECT_ID` | `xxxxx` |

Do **not** commit real values to the repo. The `.env` file in the repo is only for local development.

## 4. Deploy to Vercel

1. Push this repo to GitHub.
2. Import the repo in the Vercel dashboard.
3. Vercel will detect the project and use the settings from `vercel.json`.
4. Add the environment variables from step 3.
5. Deploy.

### Routing

`vercel.json` is already configured so that dynamic pages like `tapaura.boostinsta.co.in/bookstore` work on direct visits and refresh.

## 5. Add the custom domain

1. In Vercel, go to **Project Settings → Domains**.
2. Add `tapaura.boostinsta.co.in`.
3. In your DNS provider (wherever `boostinsta.co.in` is managed), add the CNAME/A records that Vercel shows you.
4. Wait for DNS propagation and SSL issuance.

## 6. Update Google OAuth origins and redirect URIs

After the Vercel domain is live, return to Google Cloud Console and add the final origin:
- `https://tapaura.boostinsta.co.in`

And the final redirect URI:
- `https://tapaura.boostinsta.co.in/auth/callback`

Also update the same redirect URI in Supabase Auth → Google → Callback URL.

## 7. How the public link-tree URLs work

The route file `src/routes/$slug.tsx` already handles any short slug, so:

- `https://tapaura.boostinsta.co.in/bookstore`
- `https://tapaura.boostinsta.co.in/acme`
- `https://tapaura.boostinsta.co.in/rl-infinity`

will all work as long as the agency has created a client with that slug in the dashboard and published it.

Reserved words like `auth`, `dashboard`, `api`, `admin`, `login`, etc. are blocked from being used as slugs.

## 8. Local testing

```bash
bun install
bun run dev
```

The local dev server will use the values in `.env`. For local testing, you can point `.env` at your own Supabase project, or temporarily keep using the Lovable Cloud backend.

## 9. What was changed to support Vercel

- `src/routes/auth.tsx` now uses standard `supabase.auth.signInWithOAuth` instead of the Lovable Cloud managed OAuth helper.
- `src/integrations/lovable/index.ts` was removed.
- `package.json` no longer depends on `@lovable.dev/cloud-auth-js`.
- `vite.config.ts` now sets `nitro: { preset: "vercel" }`.
- `vercel.json` handles SPA routing and asset caching.

## 10. Notes

- The Lovable sandbox build still shows `preset: cloudflare-module` because the local sandbox environment forces it. The `vercel` preset will take effect on Vercel itself.
- The dashboard is protected and only works for signed-in users. Public pages (`/$slug`) are rendered server-side for SEO and are visible to everyone.
- All private data is enforced by Supabase RLS policies, not by the frontend alone.
