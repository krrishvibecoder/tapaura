import { ArrowUpRight } from "lucide-react";
import { getLinkKind, themeClass } from "@/lib/link-kinds";
import type { PublicClientPage } from "@/lib/public-page.functions";

export function LinkPage({ page }: { page: PublicClientPage }) {
  const initials = page.name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

  return (
    <div
      className={`${themeClass(page.theme)} min-h-screen w-full px-5 py-12`}
      style={{ backgroundColor: "var(--lp-bg)" }}
    >
      <div className="mx-auto flex w-full max-w-sm flex-col items-center">
        <div
          className="flex size-24 items-center justify-center overflow-hidden rounded-2xl border-2 bg-white/95"
          style={{ borderColor: "var(--lp-frame)" }}
        >
          {page.logoUrl ? (
            <img
              src={page.logoUrl}
              alt={`${page.name} logo`}
              className="size-full object-contain p-2"
              loading="eager"
            />
          ) : (
            <span
              className="font-display text-2xl font-bold"
              style={{ color: "var(--lp-card-title)" }}
            >
              {initials}
            </span>
          )}
        </div>

        <h1
          className="mt-6 text-center text-2xl font-bold"
          style={{ color: "var(--lp-heading)" }}
        >
          {page.name}
        </h1>

        {page.tagline ? (
          <p
            className="mt-2 text-center text-sm leading-relaxed"
            style={{ color: "var(--lp-body)" }}
          >
            {page.tagline}
          </p>
        ) : null}

        {page.ctaUrl ? (
          <a
            href={page.ctaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center justify-center rounded-full px-8 py-3 text-sm font-semibold shadow-sm transition-transform hover:scale-[1.02]"
            style={{ backgroundColor: "var(--lp-cta)", color: "var(--lp-cta-fg)" }}
          >
            {page.ctaLabel}
          </a>
        ) : (
          <span
            className="mt-6 inline-flex items-center justify-center rounded-full px-8 py-3 text-sm font-semibold"
            style={{ backgroundColor: "var(--lp-cta)", color: "var(--lp-cta-fg)" }}
          >
            {page.ctaLabel}
          </span>
        )}

        <ul className="mt-8 w-full space-y-4">
          {page.links.map((link) => {
            const meta = getLinkKind(link.kind);
            const Icon = meta.icon;
            return (
              <li key={link.id}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 rounded-2xl p-4 shadow-sm transition-transform hover:scale-[1.01]"
                  style={{ backgroundColor: "var(--lp-card)" }}
                >
                  <span
                    className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${meta.tile}`}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-sm font-semibold"
                      style={{ color: "var(--lp-card-title)" }}
                    >
                      {link.title}
                    </span>
                    {link.subtitle ? (
                      <span
                        className="block truncate text-xs"
                        style={{ color: "var(--lp-card-sub)" }}
                      >
                        {link.subtitle}
                      </span>
                    ) : null}
                  </span>
                  <ArrowUpRight
                    className="size-4 shrink-0"
                    style={{ color: "var(--lp-arrow)" }}
                    aria-hidden="true"
                  />
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
