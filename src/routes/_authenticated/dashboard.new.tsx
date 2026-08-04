import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { createClientPage } from "@/lib/clients.functions";
import { slugify } from "@/lib/link-kinds";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/dashboard/new")({
  head: () => ({
    meta: [
      { title: "New client page — Linktrail" },
      { name: "description", content: "Create a new branded link page for a client." },
      { property: "og:title", content: "New client page — Linktrail" },
      { property: "og:description", content: "Create a new branded link page for a client." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NewClient,
});

function NewClient() {
  const navigate = useNavigate();
  const create = useServerFn(createClientPage);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const created = await create({
        data: {
          name: name.trim(),
          slug: slug || slugify(name),
          tagline: null,
          logo_path: null,
          cta_label: "Connect With Us",
          cta_url: null,
          theme: "blue",
          published: false,
        },
      });
      toast.success("Client page created");
      navigate({ to: "/dashboard/$id", params: { id: created.id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create the page");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to client pages
      </Link>

      <h1 className="mt-6 text-2xl font-bold">New client page</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Start with the basics — you can add the logo, links and theme next.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="name">Client name</Label>
          <Input
            id="name"
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slugEdited) setSlug(slugify(e.target.value));
            }}
            placeholder="Fone Box"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="slug">Page address</Label>
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground">/</span>
            <Input
              id="slug"
              required
              value={slug}
              onChange={(e) => {
                setSlugEdited(true);
                setSlug(slugify(e.target.value));
              }}
              placeholder="fone-box"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Lowercase letters, numbers and dashes. At least 3 characters.
          </p>
        </div>

        <Button type="submit" disabled={busy || slug.length < 3}>
          Create page
        </Button>
      </form>
    </main>
  );
}
