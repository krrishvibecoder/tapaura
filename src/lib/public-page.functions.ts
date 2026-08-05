import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Palette } from "./palette";
import type { VCardData } from "./vcard";

const slugSchema = z.object({ slug: z.string().min(1).max(60) });

export interface PublicLink {
  id: string;
  kind: string;
  title: string;
  subtitle: string | null;
  url: string;
}

export interface PublicClientPage {
  name: string;
  slug: string;
  tagline: string | null;
  logoUrl: string | null;
  ctaLabel: string;
  ctaUrl: string | null;
  theme: string;
  palette: Palette | null;
  vcard: VCardData | null;
  links: PublicLink[];
}

export const getPublicClientPage = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => slugSchema.parse(data))
  .handler(async ({ data }): Promise<PublicClientPage | null> => {
    const { getPublishedClientPage } = await import("./public-page.server");
    return getPublishedClientPage(data.slug);
  });
