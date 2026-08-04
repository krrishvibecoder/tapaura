import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const slugRe = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;

const clientFields = z.object({
  name: z.string().trim().min(1).max(80),
  slug: z.string().trim().toLowerCase().regex(slugRe, "Use lowercase letters, numbers and dashes"),
  tagline: z.string().trim().max(140).nullable(),
  logo_path: z.string().trim().max(300).nullable(),
  cta_label: z.string().trim().min(1).max(40),
  cta_url: z.string().trim().max(500).nullable(),
  theme: z.enum(["blue", "cream", "ink"]),
  published: z.boolean(),
});


const linkInput = z.object({
  id: z.string().uuid().optional(),
  kind: z.string().trim().min(1).max(40),
  title: z.string().trim().min(1).max(60),
  subtitle: z.string().trim().max(120).nullable().optional(),
  url: z.string().trim().min(1).max(500),
});

export const listMyClients = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("clients")
      .select("id, name, slug, tagline, published, theme, updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const getMyClient = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: client, error } = await context.supabase
      .from("clients")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!client) return null;

    const { data: links, error: linkError } = await context.supabase
      .from("client_links")
      .select("id, kind, title, subtitle, url, position")
      .eq("client_id", client.id)
      .order("position", { ascending: true });
    if (linkError) throw new Error(linkError.message);

    return { client, links: links ?? [] };
  });

export const checkSlug = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ slug: z.string().trim().toLowerCase(), excludeId: z.string().uuid().optional() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    if (!slugRe.test(data.slug)) return { available: false, reason: "format" as const };
    let query = context.supabase.from("clients").select("id").eq("slug", data.slug);
    if (data.excludeId) query = query.neq("id", data.excludeId);
    const { data: rows, error } = await query.limit(1);
    if (error) throw new Error(error.message);
    return { available: (rows?.length ?? 0) === 0, reason: "taken" as const };
  });

function friendly(message: string): string {
  if (message.includes("slug_reserved")) return "That address is reserved — pick another one.";
  if (message.includes("clients_slug_key") || message.includes("duplicate key"))
    return "That address is already taken.";
  if (message.includes("clients_slug_format"))
    return "Use lowercase letters, numbers and dashes only.";
  return message;
}

export const createClientPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => clientFields.parse(data))
  .handler(async ({ data, context }) => {
    const { data: created, error } = await context.supabase
      .from("clients")
      .insert({ ...data, owner_id: context.userId })
      .select("id")
      .single();
    if (error) throw new Error(friendly(error.message));
    return created;
  });

export const updateClientPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    clientFields.extend({ id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { id, ...fields } = data;
    const { error } = await context.supabase.from("clients").update(fields).eq("id", id);
    if (error) throw new Error(friendly(error.message));
    return { ok: true };
  });

export const setPublished = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), published: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("clients")
      .update({ published: data.published })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteClientPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("clients").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Replaces the whole link list for a client, preserving order. */
export const saveClientLinks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ clientId: z.string().uuid(), links: z.array(linkInput).max(30) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: owned, error: ownError } = await context.supabase
      .from("clients")
      .select("id")
      .eq("id", data.clientId)
      .maybeSingle();
    if (ownError) throw new Error(ownError.message);
    if (!owned) throw new Error("Client page not found");

    const { error: delError } = await context.supabase
      .from("client_links")
      .delete()
      .eq("client_id", data.clientId);
    if (delError) throw new Error(delError.message);

    if (data.links.length > 0) {
      const rows = data.links.map((link, index) => ({
        client_id: data.clientId,
        kind: link.kind,
        title: link.title,
        subtitle: link.subtitle ?? null,
        url: link.url,
        position: index,
      }));
      const { error: insError } = await context.supabase.from("client_links").insert(rows);
      if (insError) throw new Error(insError.message);
    }
    return { ok: true };
  });
