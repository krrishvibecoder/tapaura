# Align local preview and Vercel to your Supabase project

## Current state

- `VERCEL_DEPLOY.md` already targets your project: `https://uufddanpukimuyahglxz.supabase.co`.
- Local `.env` still points to the Lovable-managed project: `https://oxykkgzgmlzlfbfocueb.supabase.co`.
- `src/lib/public-page.server.ts` imports `@/integrations/supabase/client.server`, so a local `SUPABASE_SERVICE_ROLE_KEY` is required for logo storage to work in the preview.
- The only other file referencing the old project ID is `supabase/config.toml`, which is auto-generated and should not be edited.

## What I need from you

Your Supabase service role key, **after you have rotated it** (the old one was shared in chat). I will not commit it; it will go only into the local `.env` file.

## What I will update in the repo

1. `.env`
   - Set all `SUPABASE_*` and `VITE_SUPABASE_*` values to `https://uufddanpukimuyahglxz.supabase.co` and your publishable key `sb_publishable_gmg0_ImXARlOyAnzujBJvQ_xdxZ5co9`.
   - Add `SUPABASE_SERVICE_ROLE_KEY` with the rotated key you provide.
2. `.env.example`
   - Replace the placeholder publishable key with your real one so the example is copy-paste ready.
   - Keep the service role key as a placeholder, with a note that it must never be committed.
3. `VERCEL_DEPLOY.md`
   - Add a section explaining that local preview and Vercel should use the same backend.
   - Clarify the exact environment variables for both `.env` (local) and Vercel (Production/Preview/Development).
   - Keep the existing key-rotation warning and checklist.

## What you must do in Vercel yourself

I cannot edit your Vercel project directly. Confirm these variables are set in Vercel → Project Settings → Environment Variables (for Production, Preview, and Development):

- `SUPABASE_URL` = `https://uufddanpukimuyahglxz.supabase.co`
- `SUPABASE_PUBLISHABLE_KEY` = your `sb_publishable_...` key
- `SUPABASE_SERVICE_ROLE_KEY` = your rotated `sb_secret_...` key
- `SUPABASE_PROJECT_ID` = `uufddanpukimuyahglxz`
- `VITE_SUPABASE_URL` = same as `SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` = same as `SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID` = `uufddanpukimuyahglxz`

After changing them, trigger a redeploy so the new values are baked into the build.

## Outcome

Local preview and the live Vercel deployment will both talk to the same `uufddanpukimuyahglxz` Supabase project, making debugging and testing consistent.
