import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Link2, Lock, Palette } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Linktrail — client link pages for agencies" },
      {
        name: "description",
        content:
          "Give every client a branded link-in-bio page on its own short address. Your dashboard stays private.",
      },
      { property: "og:title", content: "Linktrail — client link pages for agencies" },
      {
        property: "og:description",
        content:
          "Give every client a branded link-in-bio page on its own short address. Your dashboard stays private.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: Link2,
    title: "One address per client",
    body: "Every page lives at /their-name. Short, clean, and easy to print on packaging or a card.",
  },
  {
    icon: Lock,
    title: "Your side stays hidden",
    body: "Clients only ever see their own page. The dashboard and your other clients are behind login.",
  },
  {
    icon: Palette,
    title: "Branded in seconds",
    body: "Logo, name, tagline, a Connect With Us button and icon link cards — three themes to match the brand.",
  },
];

function Landing() {
  return (
    <main className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="font-display text-lg font-bold tracking-tight">Linktrail</span>
        <Link
          to="/auth"
          className="rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
        >
          Sign in
        </Link>
      </header>

      <section className="mx-auto grid max-w-5xl items-center gap-14 px-6 pt-10 pb-24 md:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            For agencies & studios
          </p>
          <h1 className="mt-5 text-4xl leading-[1.05] font-bold text-balance sm:text-5xl">
            A link page for every client, managed from one private dashboard.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
            Build the page, hand over the address, keep everything else to yourself. No client logins,
            no shared dashboards, no traces of your other work.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
            >
              Create your first page
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <span className="text-sm text-muted-foreground">Free while you set things up.</span>
          </div>
        </div>

        <div className="lp-blue mx-auto w-full max-w-[260px] rounded-[2.25rem] border-8 border-primary p-4 shadow-xl" style={{ backgroundColor: "var(--lp-bg)" }}>
          <div className="flex flex-col items-center py-6">
            <div
              className="flex size-16 items-center justify-center rounded-2xl border-2 bg-white/95 font-display text-lg font-bold"
              style={{ borderColor: "var(--lp-frame)", color: "var(--lp-card-title)" }}
            >
              FB
            </div>
            <p className="mt-4 font-display text-base font-bold" style={{ color: "var(--lp-heading)" }}>
              Fone Box
            </p>
            <p className="mt-1 text-[11px]" style={{ color: "var(--lp-body)" }}>
              Mobile repairs & accessories
            </p>
            <span
              className="mt-4 rounded-full px-5 py-2 text-[11px] font-semibold"
              style={{ backgroundColor: "var(--lp-cta)", color: "var(--lp-cta-fg)" }}
            >
              Connect With Us
            </span>
            <div className="mt-5 w-full space-y-2">
              {["Instagram", "WhatsApp", "Google Reviews"].map((label) => (
                <div
                  key={label}
                  className="flex items-center gap-2 rounded-xl p-2.5 text-[11px] font-semibold"
                  style={{ backgroundColor: "var(--lp-card)", color: "var(--lp-card-title)" }}
                >
                  <span className="size-6 rounded-lg bg-tile-neutral" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-secondary/40">
        <div className="mx-auto grid max-w-5xl gap-8 px-6 py-16 md:grid-cols-3">
          {features.map(({ icon: Icon, title, body }) => (
            <div key={title}>
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-lg font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto max-w-5xl px-6 py-10 text-sm text-muted-foreground">
        Linktrail — built for agencies managing many client brands.
      </footer>
    </main>
  );
}
