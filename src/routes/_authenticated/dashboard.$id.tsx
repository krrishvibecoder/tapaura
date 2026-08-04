import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, GripVertical, Plus, Trash2 } from "lucide-react";
import {
  getMyClient,
  updateClientPage,
  saveClientLinks,
  deleteClientPage,
} from "@/lib/clients.functions";
import { LINK_KINDS, getLinkKind, THEMES, slugify } from "@/lib/link-kinds";
import { LinkPage } from "@/components/LinkPage";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/dashboard/$id")({
  head: () => ({
    meta: [
      { title: "Edit client page — Linktrail" },
      { name: "description", content: "Edit the logo, tagline, theme and links for this client." },
      { property: "og:title", content: "Edit client page — Linktrail" },
      {
        property: "og:description",
        content: "Edit the logo, tagline, theme and links for this client.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EditClient,
});

interface DraftLink {
  key: string;
  kind: string;
  title: string;
  subtitle: string;
  url: string;
}

function EditClient() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const fetchClient = useServerFn(getMyClient);
  const saveClient = useServerFn(updateClientPage);
  const saveLinks = useServerFn(saveClientLinks);
  const removeClient = useServerFn(deleteClientPage);

  const { data, isLoading } = useQuery({
    queryKey: ["client", id],
    queryFn: () => fetchClient({ data: { id } }),
  });

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [tagline, setTagline] = useState("");
  const [ctaLabel, setCtaLabel] = useState("Connect With Us");
  const [ctaUrl, setCtaUrl] = useState("");
  const [theme, setTheme] = useState("blue");
  const [published, setPublished] = useState(false);
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [links, setLinks] = useState<DraftLink[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!data) return;
    const c = data.client;
    setName(c.name);
    setSlug(c.slug);
    setTagline(c.tagline ?? "");
    setCtaLabel(c.cta_label);
    setCtaUrl(c.cta_url ?? "");
    setTheme(c.theme);
    setPublished(c.published);
    setLogoPath(c.logo_path);
    setLinks(
      data.links.map((link, index) => ({
        key: `${link.id}-${index}`,
        kind: link.kind,
        title: link.title,
        subtitle: link.subtitle ?? "",
        url: link.url,
      })),
    );
  }, [data]);

  useEffect(() => {
    if (!logoPath) {
      setLogoUrl(null);
      return;
    }
    let active = true;
    void supabase.storage
      .from("client-logos")
      .createSignedUrl(logoPath, 3600)
      .then(({ data: signed }) => {
        if (active) setLogoUrl(signed?.signedUrl ?? null);
      });
    return () => {
      active = false;
    };
  }, [logoPath]);

  async function handleLogo(file: File) {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const path = `${userId}/${id}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("client-logos").upload(path, file, {
      upsert: true,
      contentType: file.type,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setLogoPath(path);
    toast.success("Logo uploaded — remember to save");
  }

  function addLink(kind: string) {
    const meta = getLinkKind(kind);
    setLinks((prev) => [
      ...prev,
      {
        key: `new-${Date.now()}`,
        kind,
        title: meta.defaultTitle,
        subtitle: meta.defaultSubtitle,
        url: "",
      },
    ]);
  }

  function updateLink(key: string, patch: Partial<DraftLink>) {
    setLinks((prev) => prev.map((link) => (link.key === key ? { ...link, ...patch } : link)));
  }

  function move(key: string, direction: -1 | 1) {
    setLinks((prev) => {
      const index = prev.findIndex((l) => l.key === key);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item!);
      return next;
    });
  }

  async function handleSave() {
    setBusy(true);
    try {
      await saveClient({
        data: {
          id,
          name: name.trim(),
          slug,
          tagline: tagline.trim() || null,
          logo_path: logoPath,
          cta_label: ctaLabel.trim() || "Connect With Us",
          cta_url: ctaUrl.trim() || null,
          theme: theme as "blue" | "cream" | "ink",
          published,
        },
      });
      await saveLinks({
        data: {
          clientId: id,
          links: links
            .filter((link) => link.url.trim().length > 0)
            .map((link) => ({
              kind: link.kind,
              title: link.title.trim() || getLinkKind(link.kind).defaultTitle,
              subtitle: link.subtitle.trim() || null,
              url: link.url.trim(),
            })),
        },
      });
      toast.success("Saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this client page? This can't be undone.")) return;
    try {
      await removeClient({ data: { id } });
      toast.success("Client page deleted");
      navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete");
    }
  }

  if (isLoading) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-10">
        <Skeleton className="h-64 w-full rounded-2xl" />
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h1 className="text-xl font-bold">Client page not found</h1>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/dashboard">Back to client pages</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to client pages
      </Link>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{name || "Client page"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Public address: <span className="font-medium text-foreground">/{slug}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch id="published" checked={published} onCheckedChange={setPublished} />
            <Label htmlFor="published" className="text-sm">
              Published
            </Label>
          </div>
          <Button onClick={handleSave} disabled={busy}>
            Save changes
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          <section className="space-y-5 rounded-2xl border border-border bg-card p-6">
            <h2 className="text-base font-semibold">Brand</h2>

            <div className="space-y-1.5">
              <Label htmlFor="c-name">Client name</Label>
              <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="c-slug">Page address</Label>
              <Input
                id="c-slug"
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="c-tagline">Tagline</Label>
              <Input
                id="c-tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Mobile repairs & accessories"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="c-logo">Logo</Label>
              <Input
                id="c-logo"
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleLogo(file);
                }}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="c-theme">Theme</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger id="c-theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {THEMES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>

          <section className="space-y-5 rounded-2xl border border-border bg-card p-6">
            <h2 className="text-base font-semibold">Call to action</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="cta-label">Button label</Label>
                <Input
                  id="cta-label"
                  value={ctaLabel}
                  onChange={(e) => setCtaLabel(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cta-url">Button link</Label>
                <Input
                  id="cta-url"
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                  placeholder="https://wa.me/919999999999"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Links</h2>
              <Select value="" onValueChange={addLink}>
                <SelectTrigger className="w-44">
                  <span className="flex items-center gap-1.5 text-sm">
                    <Plus className="size-4" aria-hidden="true" />
                    Add link
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {LINK_KINDS.map((kind) => (
                    <SelectItem key={kind.kind} value={kind.kind}>
                      {kind.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {links.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No links yet. Add Instagram, WhatsApp, Google Reviews and more.
              </p>
            ) : null}

            {links.map((link, index) => {
              const meta = getLinkKind(link.kind);
              const Icon = meta.icon;
              return (
                <div key={link.key} className="rounded-xl border border-border p-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex size-8 items-center justify-center rounded-lg ${meta.tile}`}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="flex-1 text-sm font-medium">{meta.label}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Move up"
                      disabled={index === 0}
                      onClick={() => move(link.key, -1)}
                    >
                      <GripVertical className="size-4 rotate-180" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Move down"
                      disabled={index === links.length - 1}
                      onClick={() => move(link.key, 1)}
                    >
                      <GripVertical className="size-4" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Remove link"
                      onClick={() =>
                        setLinks((prev) => prev.filter((item) => item.key !== link.key))
                      }
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <Input
                      value={link.title}
                      onChange={(e) => updateLink(link.key, { title: e.target.value })}
                      placeholder="Card title"
                      aria-label="Card title"
                    />
                    <Input
                      value={link.subtitle}
                      onChange={(e) => updateLink(link.key, { subtitle: e.target.value })}
                      placeholder="Short description"
                      aria-label="Card description"
                    />
                    <Input
                      className="sm:col-span-2"
                      value={link.url}
                      onChange={(e) => updateLink(link.key, { url: e.target.value })}
                      placeholder={meta.placeholder}
                      aria-label="Destination URL"
                    />
                  </div>
                </div>
              );
            })}
          </section>

          <Button variant="ghost" className="text-destructive" onClick={handleDelete}>
            Delete this client page
          </Button>
        </div>

        <aside className="lg:sticky lg:top-8 lg:self-start">
          <p className="mb-3 text-xs font-semibold tracking-[0.15em] text-muted-foreground uppercase">
            Live preview
          </p>
          <div className="overflow-hidden rounded-2xl border border-border">
            <div className="origin-top scale-90">
              <LinkPage
                page={{
                  name: name || "Client name",
                  slug,
                  tagline: tagline || null,
                  logoUrl,
                  ctaLabel: ctaLabel || "Connect With Us",
                  ctaUrl: ctaUrl || null,
                  theme,
                  links: links.map((link, index) => ({
                    id: link.key,
                    kind: link.kind,
                    title: link.title || getLinkKind(link.kind).defaultTitle,
                    subtitle: link.subtitle || null,
                    url: link.url || "#",
                    position: index,
                  })),
                }}
              />
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
