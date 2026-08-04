import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, Plus } from "lucide-react";
import { listMyClients } from "@/lib/clients.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  head: () => ({
    meta: [
      { title: "Client pages — Linktrail" },
      { name: "description", content: "Manage every client link page from one dashboard." },
      { property: "og:title", content: "Client pages — Linktrail" },
      {
        property: "og:description",
        content: "Manage every client link page from one dashboard.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const fetchClients = useServerFn(listMyClients);
  const { data, isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => fetchClients(),
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Client pages</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Each page is public at its own address. Everything here stays private.
          </p>
        </div>
        <Button asChild>
          <Link to="/dashboard/new">
            <Plus className="size-4" aria-hidden="true" />
            New client page
          </Link>
        </Button>
      </div>

      <div className="mt-8 space-y-3">
        {isLoading ? (
          <>
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </>
        ) : (data?.length ?? 0) === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <h2 className="font-semibold">No client pages yet</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              Create your first one — add the logo, tagline and links, then share the address with
              your client.
            </p>
            <Button asChild className="mt-6">
              <Link to="/dashboard/new">Create a client page</Link>
            </Button>
          </div>
        ) : (
          data?.map((client) => (
            <div
              key={client.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="truncate font-semibold">{client.name}</h2>
                  <Badge variant={client.published ? "default" : "secondary"}>
                    {client.published ? "Live" : "Draft"}
                  </Badge>
                </div>
                <p className="mt-1 truncate text-sm text-muted-foreground">/{client.slug}</p>
              </div>
              <div className="flex items-center gap-2">
                {client.published ? (
                  <Button variant="ghost" size="sm" asChild>
                    <a href={`/${client.slug}`} target="_blank" rel="noopener noreferrer">
                      View
                      <ExternalLink className="size-3.5" aria-hidden="true" />
                    </a>
                  </Button>
                ) : null}
                <Button variant="outline" size="sm" asChild>
                  <Link to="/dashboard/$id" params={{ id: client.id }}>
                    Edit
                  </Link>
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
