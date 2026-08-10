# Tapaura — deploy to Vercel with your own Supabase

Project values used in this guide:

| Thing | Value |
|---|---|
| Supabase URL | `https://uufddanpukimuyahglxz.supabase.co` |
| Supabase project ID | `uufddanpukimuyahglxz` |
| GitHub repo | `https://github.com/krrishvibecoder/tapaura` |
| Current Vercel URL | `https://tapaura-git-main-krrishpurohit23-3817s-projects.vercel.app` |
| Final domain | `https://tapaura.boostinsta.co.in` |

---

## 0. Rotate your secret key first (important)

Your Supabase **secret / service_role key** was shared in chat, so treat it as compromised.

1. Supabase → **Project Settings → API Keys**.
2. **Rotate** the secret key.
3. Use the new value **only** in Vercel environment variables — never in the repo, never in browser code.

Also make sure `.env` is not in git:

```bash
git rm --cached .env
git commit -m "stop tracking .env"
```

`.gitignore` in this repo already ignores `.env`.

---

## 1. Create the database schema

1. Supabase → **SQL Editor → New query**.
2. Paste the full contents of `tapaura_bootstrap.sql` from this repo and run it.
3. Supabase → **Storage → Buckets**: confirm `client-logos` exists (private, 5 MB limit).

---

## 2. Supabase Auth URL configuration

Supabase → **Authentication → URL Configuration**:

- **Site URL**: `https://tapaura.boostinsta.co.in`
- **Redirect URLs** (add all of these):
  - `https://tapaura.boostinsta.co.in`
  - `https://tapaura.boostinsta.co.in/**`
  - `https://tapaura-git-main-krrishpurohit23-3817s-projects.vercel.app`
  - `https://tapaura-git-main-krrishpurohit23-3817s-projects.vercel.app/**`
  - `http://localhost:8080`
  - `http://localhost:8080/**`

The app signs in with `redirectTo: window.location.origin`, so each origin you use must be listed here.

---

## 3. Google sign-in

### Google Cloud Console → APIs & Services → Credentials

Create an **OAuth client ID → Web application**.

**Authorized JavaScript origins**
- `https://tapaura.boostinsta.co.in`
- `https://tapaura-git-main-krrishpurohit23-3817s-projects.vercel.app`
- `http://localhost:8080`

**Authorized redirect URIs** (this one is Supabase's callback, not your site)
- `https://uufddanpukimuyahglxz.supabase.co/auth/v1/callback`

Also configure the OAuth consent screen with scopes: `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`.

### Supabase

**Authentication → Providers → Google** → enable, paste the Google **Client ID** and **Client Secret**, save.

### Troubleshooting Google sign-in

| Error you see | Cause | Fix |
|---|---|---|
| `validation_failed` / `Unsupported provider: missing OAuth secret` | Google provider is not enabled in your Supabase project, or the Client Secret field is empty | Supabase → Authentication → Providers → Google: enable it and paste both Client ID and Client Secret, then save |
| `Unsupported provider: provider is not enabled` | Same as above — provider toggle is off | Enable the Google provider and save |
| `redirect_uri_mismatch` (Google screen) | The Supabase callback URL is missing from the Google OAuth client | Add `https://uufddanpukimuyahglxz.supabase.co/auth/v1/callback` under Authorized redirect URIs |
| Google succeeds but you land back on the sign-in page with no session | The origin you signed in from is not in Supabase's redirect allow-list | Add that exact origin (and `/**`) under Authentication → URL Configuration → Redirect URLs |
| `access_blocked` / `app not verified` | OAuth consent screen still in testing | Add your Google account as a test user, or publish the consent screen |

Provider changes take effect immediately — no Vercel redeploy needed.



---

## 4. Vercel environment variables

Vercel → **Project Settings → Environment Variables** (add to Production, Preview, and Development):

| Name | Value |
|---|---|
| `SUPABASE_URL` | `https://uufddanpukimuyahglxz.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | your `sb_publishable_...` anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | your **rotated** `sb_secret_...` key |
| `SUPABASE_PROJECT_ID` | `uufddanpukimuyahglxz` |
| `VITE_SUPABASE_URL` | same as `SUPABASE_URL` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | same as `SUPABASE_PUBLISHABLE_KEY` |
| `VITE_SUPABASE_PROJECT_ID` | `uufddanpukimuyahglxz` |

Only the `VITE_*` values reach the browser. The service role key stays server-side.

After adding them, trigger a **redeploy** (env vars are baked in at build time).

---

## 5. Custom domain

1. Vercel → **Project Settings → Domains** → add `tapaura.boostinsta.co.in`.
2. In the DNS for `boostinsta.co.in`, add the `CNAME` record Vercel shows:
   - Name: `tapaura`
   - Value: `cname.vercel-dns.com`
3. Wait for DNS + SSL.
4. Set it as the primary domain, then confirm it is listed in Google origins (step 3) and Supabase redirect URLs (step 2).

---

## 6. How the client link-tree URLs work

`src/routes/$slug.tsx` handles any slug, so once an agency creates and publishes a client:

- `https://tapaura.boostinsta.co.in/bookstore`
- `https://tapaura.boostinsta.co.in/acme`
- `https://tapaura.boostinsta.co.in/rl-infinity`

all work on direct visit and on refresh — `vercel.json` rewrites non-asset paths into the app.

Reserved words (`auth`, `dashboard`, `api`, `admin`, `login`, …) are blocked as slugs by a database trigger.

---

## 7. Local development

The local preview should use the **same backend** as Vercel so you can test against the same data and auth setup.

### 7.1 Local `.env` values

Copy `.env.example` to `.env` and confirm these values:

| Name | Value |
|---|---|
| `SUPABASE_URL` | `https://uufddanpukimuyahglxz.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_gmg0_ImXARlOyAnzujBJvQ_xdxZ5co9` |
| `SUPABASE_PROJECT_ID` | `uufddanpukimuyahglxz` |
| `SUPABASE_SERVICE_ROLE_KEY` | your rotated `sb_secret_...` key (uncomment the line in `.env`) |
| `VITE_SUPABASE_URL` | same as `SUPABASE_URL` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | same as `SUPABASE_PUBLISHABLE_KEY` |
| `VITE_SUPABASE_PROJECT_ID` | `uufddanpukimuyahglxz` |

`SUPABASE_SERVICE_ROLE_KEY` is required for logo storage to work in the local preview (the public link page uses admin storage access). If you do not add it, logo uploads and public page rendering will fail locally even though auth and links work.

### 7.2 Start the dev server

```bash
bun install
bun run dev
```

Dev server runs on `http://localhost:8080`.

### 7.3 Confirm local preview matches Vercel

After signing in locally, create a client and upload a logo. The data should appear in the same Supabase project (`uufddanpukimuyahglxz`) that Vercel uses.


---

## 8. What in the code supports this

- `src/routes/auth.tsx` uses standard `supabase.auth.signInWithOAuth` (no Lovable-managed OAuth broker).
- `src/integrations/lovable/` removed; `@lovable.dev/cloud-auth-js` removed from `package.json`.
- `vite.config.ts` sets `nitro: { preset: "vercel" }`.
- `vercel.json` handles slug routing and asset caching.

Note: local sandbox builds still report the Cloudflare preset — that is a sandbox override; the Vercel preset applies on Vercel.

---

## 9. Checklist

- [ ] Secret key rotated
- [ ] `.env` untracked in git
- [ ] `tapaura_bootstrap.sql` run
- [ ] Supabase Site URL + redirect URLs set
- [ ] Google OAuth client created and pasted into Supabase
- [ ] Vercel env vars added and redeployed
- [ ] Custom domain live
- [ ] Sign in works, then create a client and open `/<slug>` in a private window
