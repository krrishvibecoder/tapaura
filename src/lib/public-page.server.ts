import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { PublicClientPage } from "./public-page.functions";
import { parsePalette } from "./palette";
import { parseVcard } from "./vcard";

function publicClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Supabase server environment is not configured");
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export async function getPublishedClientPage(slug: string): Promise<PublicClientPage | null> {
  const supabase = publicClient();
  const { data: client, error } = await supabase
    .from("clients")
    .select("id, name, slug, tagline, logo_path, cta_label, cta_url, theme, palette, vcard")
    .eq("slug", slug.toLowerCase())
    .eq("published", true)
    .maybeSingle();

  if (error || !client) return null;

  const { data: links } = await supabase
    .from("client_links")
    .select("id, kind, title, subtitle, url")
    .eq("client_id", client.id)
    .order("position", { ascending: true });

  let logoUrl: string | null = null;
  if (client.logo_path) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed } = await supabaseAdmin.storage
      .from("client-logos")
      .createSignedUrl(client.logo_path, 60 * 60 * 24 * 7);
    logoUrl = signed?.signedUrl ?? null;
  }

  return {
    name: client.name,
    slug: client.slug,
    tagline: client.tagline,
    logoUrl,
    ctaLabel: client.cta_label,
    ctaUrl: client.cta_url,
    theme: client.theme,
    palette: parsePalette(client.palette),
    vcard: parseVcard(client.vcard),
    links: links ?? [],
  };
}
