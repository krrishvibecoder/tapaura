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
import {
  HOUSE_PALETTES,
  extractPalettesFromLogo,
  isValidHex,
  parsePalette,
  type Palette,
  type PaletteOption,
} from "@/lib/palette";
import { EMPTY_VCARD, parseVcard, type VCardData } from "@/lib/vcard";
import { LinkPage } from "@/components/LinkPage";
import { PageQrCode } from "@/components/PageQrCode";
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
  const [palette, setPalette] = useState<Palette | null>(null);
  const [logoPalettes, setLogoPalettes] = useState<PaletteOption[]>([]);
  const [vcardOn, setVcardOn] = useState(false);
  const [vcard, setVcard] = useState<VCardData>(EMPTY_VCARD);
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
    setPalette(parsePalette(c.palette));
    const savedVcard = parseVcard(c.vcard);
    setVcardOn(savedVcard !== null);
    setVcard(savedVcard ?? { ...EMPTY_VCARD, fullName: c.name });
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

    try {
      const options = await extractPalettesFromLogo(file);
      setLogoPalettes(options);
      if (options[0]) {
        setPalette({ primary: options[0].primary, accent: options[0].accent });
        setTheme("custom");
      }
    } catch {
      setLogoPalettes([]);
    }
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
          theme: (palette ? "custom" : theme) as "blue" | "cream" | "ink" | "custom",
          published,
          palette,
          vcard: vcardOn
            ? {
                ...vcard,
                fullName: vcard.fullName.trim() || name.trim(),
                socials: vcard.socials.filter((s) => s.url.trim().length > 0),
              }
            : null,
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

  const publicUrl =
    typeof window !== "undefined" ? `${window.location.origin}/${slug}` : `/${slug}`;

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
              <Select
                value={palette ? "custom" : theme}
                onValueChange={(value) => {
                  setPalette(null);
                  setTheme(value);
                }}
              >
                <SelectTrigger id="c-theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {palette ? <SelectItem value="custom">Custom colours</SelectItem> : null}
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
            <div>
              <h2 className="text-base font-semibold">Colours</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Upload a logo and we pick matching palettes automatically. You can also use one of
                ours or set your own.
              </p>
            </div>

            {logoPalettes.length > 0 ? (
              <div className="space-y-2">
                <Label>From this logo</Label>
                <div className="flex flex-wrap gap-2">
                  {logoPalettes.map((option) => (
                    <SwatchButton
                      key={option.id}
                      option={option}
                      active={
                        palette?.primary === option.primary && palette?.accent === option.accent
                      }
                      onSelect={() => {
                        setPalette({ primary: option.primary, accent: option.accent });
                        setTheme("custom");
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label>Our palettes</Label>
              <div className="flex flex-wrap gap-2">
                {HOUSE_PALETTES.map((option) => (
                  <SwatchButton
                    key={option.id}
                    option={option}
                    active={palette?.primary === option.primary && palette?.accent === option.accent}
                    onSelect={() => {
                      setPalette({ primary: option.primary, accent: option.accent });
                      setTheme("custom");
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="col-primary">Background colour</Label>
                <Input
                  id="col-primary"
                  type="color"
                  className="h-10 p-1"
                  value={palette?.primary ?? "#2f4bd0"}
                  onChange={(e) => {
                    if (!isValidHex(e.target.value)) return;
                    setPalette({
                      primary: e.target.value,
                      accent: palette?.accent ?? "#ffd24a",
                    });
                    setTheme("custom");
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="col-accent">Accent colour</Label>
                <Input
                  id="col-accent"
                  type="color"
                  className="h-10 p-1"
                  value={palette?.accent ?? "#ffd24a"}
                  onChange={(e) => {
                    if (!isValidHex(e.target.value)) return;
                    setPalette({
                      primary: palette?.primary ?? "#2f4bd0",
                      accent: e.target.value,
                    });
                    setTheme("custom");
                  }}
                />
              </div>
            </div>

            {palette ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => setPalette(null)}>
                Back to preset theme
              </Button>
            ) : null}
          </section>

          <section className="space-y-5 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold">Contact card (vCard)</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Adds a tap-to-save contact card on the link page.
                </p>
              </div>
              <Switch
                id="vcard-on"
                checked={vcardOn}
                onCheckedChange={(checked) => {
                  setVcardOn(checked);
                  if (checked && !vcard.fullName) setVcard({ ...vcard, fullName: name });
                }}
              />
            </div>

            {vcardOn ? (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="v-name">Contact name</Label>
                    <Input
                      id="v-name"
                      value={vcard.fullName}
                      onChange={(e) => setVcard({ ...vcard, fullName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="v-org">Company</Label>
                    <Input
                      id="v-org"
                      value={vcard.org ?? ""}
                      onChange={(e) => setVcard({ ...vcard, org: e.target.value || null })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="v-role">Role</Label>
                    <Input
                      id="v-role"
                      value={vcard.role ?? ""}
                      onChange={(e) => setVcard({ ...vcard, role: e.target.value || null })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="v-phone">Phone</Label>
                    <Input
                      id="v-phone"
                      value={vcard.phone ?? ""}
                      onChange={(e) => setVcard({ ...vcard, phone: e.target.value || null })}
                      placeholder="+91 99999 99999"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="v-email">Email</Label>
                    <Input
                      id="v-email"
                      value={vcard.email ?? ""}
                      onChange={(e) => setVcard({ ...vcard, email: e.target.value || null })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="v-website">Website</Label>
                    <Input
                      id="v-website"
                      value={vcard.website ?? ""}
                      onChange={(e) => setVcard({ ...vcard, website: e.target.value || null })}
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="v-address">Address</Label>
                    <Input
                      id="v-address"
                      value={vcard.address ?? ""}
                      onChange={(e) => setVcard({ ...vcard, address: e.target.value || null })}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Social profiles saved in the contact</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setVcard({
                          ...vcard,
                          socials: [...vcard.socials, { label: "Instagram", url: "" }],
                        })
                      }
                    >
                      <Plus className="size-4" aria-hidden="true" />
                      Add profile
                    </Button>
                  </div>
                  {vcard.socials.map((social, index) => (
                    <div key={index} className="grid gap-2 sm:grid-cols-[160px_1fr_auto]">
                      <Input
                        value={social.label}
                        aria-label="Profile name"
                        placeholder="Instagram"
                        onChange={(e) => {
                          const next = [...vcard.socials];
                          next[index] = { ...social, label: e.target.value };
                          setVcard({ ...vcard, socials: next });
                        }}
                      />
                      <Input
                        value={social.url}
                        aria-label="Profile URL"
                        placeholder="https://instagram.com/handle"
                        onChange={(e) => {
                          const next = [...vcard.socials];
                          next[index] = { ...social, url: e.target.value };
                          setVcard({ ...vcard, socials: next });
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Remove profile"
                        onClick={() =>
                          setVcard({
                            ...vcard,
                            socials: vcard.socials.filter((_, i) => i !== index),
                          })
                        }
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
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
          <div className="mb-6 rounded-2xl border border-border bg-card p-5">
            <p className="mb-3 text-xs font-semibold tracking-[0.15em] text-muted-foreground uppercase">
              Page QR code
            </p>
            <PageQrCode url={publicUrl} fileName={slug || "link-page"} />
          </div>
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
                  theme: palette ? "custom" : theme,
                  palette,
                  vcard: vcardOn
                    ? { ...vcard, fullName: vcard.fullName || name || "Contact" }
                    : null,
                  links: links.map((link) => ({
                    id: link.key,
                    kind: link.kind,
                    title: link.title || getLinkKind(link.kind).defaultTitle,
                    subtitle: link.subtitle || null,
                    url: link.url || "#",
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

function SwatchButton({
  option,
  active,
  onSelect,
}: {
  option: PaletteOption;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
        active ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50"
      }`}
    >
      <span className="flex">
        <span
          className="size-5 rounded-l-md border border-border"
          style={{ backgroundColor: option.primary }}
        />
        <span
          className="size-5 rounded-r-md border border-l-0 border-border"
          style={{ backgroundColor: option.accent }}
        />
      </span>
      {option.label}
    </button>
  );
}
