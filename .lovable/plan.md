# Link-in-Bio SaaS

A small SaaS where agencies sign up, log in, and build a public link page for each of their clients. Only the client page is public — your dashboard and everything else sits behind login.

## How visitors see it

Each client gets a page at `yoursite.com/acme`. A visitor opening that URL sees only the link page: logo, business name, tagline, a "Connect With Us" button, and the link cards. No app navigation, no branding of your main site, no way to browse to other clients or the dashboard.

Reserved words (`auth`, `dashboard`, `api`, etc.) are blocked as slugs so client pages never collide with app pages.

## Public client page

Matching the reference screenshots:

- Logo image at the top (rounded frame, centered)
- Business name as the headline
- Short tagline underneath
- One prominent pill-shaped "Connect With Us" button (text and target both editable)
- A stack of white link cards, each with a colored icon tile, a title, a subtitle, and a right arrow
- Mobile-first, centered, comfortable tap targets

Cards support the common link types: Website, Instagram, WhatsApp, Google Reviews, LinkedIn, Facebook, YouTube, X, Email, Phone, and a generic custom link — each with its own icon and tile color.

## Signup and login

Open signup: anyone can create an agency account with email + password, plus Google sign-in. Every account only ever sees and edits its own clients.

## Dashboard (behind login)

- **Clients list** — all your client pages with slug, live/hidden status, quick links to edit, view, and copy the public URL
- **New client** — name, slug (with live availability check), tagline, logo upload, CTA label and target
- **Edit client** — same fields, plus the link list: add, edit, remove, and drag to reorder cards
- **Published toggle** — a hidden client page returns a 404-style "page not found" until you publish it

## Pages

```text
/                       public marketing page for your SaaS (sign-up CTA)
/auth                   login + signup
/:slug                  public client link page
/dashboard              your clients list      (login required)
/dashboard/new          create a client        (login required)
/dashboard/:id          edit a client + links  (login required)
```

## Design

Dashboard: clean, neutral, utilitarian — sidebar-free, single column with cards, so it reads as a tool.

Public client pages: reproduce the reference look — deep-blue/cream backgrounds, bold rounded sans headline, yellow/gold pill CTA, soft white cards with tinted icon tiles. Fixed tasteful default theme for now; per-client color themes are an easy follow-up.

## Technical notes

- Lovable Cloud provides auth, the database, and logo storage.
- Tables: `profiles` (agency account), `clients` (owner, slug unique, name, tagline, logo path, cta label/url, published), `client_links` (client, kind, title, subtitle, url, position).
- RLS: owners full CRUD on their own rows; anonymous read limited to published clients and their links, safe columns only.
- Public `/:slug` is an SSR route reading through a publishable-key server function, so pages are crawlable and share with correct title/description/og tags per client.
- Dashboard routes live under an authenticated layout; all writes go through authenticated server functions.
- Logos stored in a public storage bucket, uploads scoped to the owner's folder.

## Follow-ups (not in this build)

Per-client color themes, view/click analytics, custom domains per client.
