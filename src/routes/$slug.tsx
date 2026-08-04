import { createFileRoute, notFound } from "@tanstack/react-router";
import { LinkPage } from "@/components/LinkPage";
import { getPublicClientPage } from "@/lib/public-page.functions";

export const Route = createFileRoute("/$slug")({
  loader: async ({ params }) => {
    const page = await getPublicClientPage({ data: { slug: params.slug } });
    if (!page) throw notFound();
    return { page };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Page unavailable" }, { name: "robots", content: "noindex" }] };
    }
    const { page } = loaderData;
    const description = page.tagline ?? `Links and contact details for ${page.name}.`;
    const meta = [
      { title: `${page.name} — Links` },
      { name: "description", content: description },
      { property: "og:title", content: `${page.name} — Links` },
      { property: "og:description", content: description },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ];
    if (page.logoUrl?.startsWith("https://")) {
      meta.push(
        { property: "og:image", content: page.logoUrl },
        { name: "twitter:image", content: page.logoUrl },
      );
    }
    return { meta };
  },
  component: PublicPage,
  errorComponent: Unavailable,
  notFoundComponent: Missing,
});

function PublicPage() {
  const { page } = Route.useLoaderData();
  return <LinkPage page={page} />;
}

function Missing() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
      <div>
        <h1 className="text-2xl font-bold">This page isn't available</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The link may be mistyped, or the page hasn't been published yet.
        </p>
      </div>
    </main>
  );
}

function Unavailable() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
      <div>
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">Please refresh and try again.</p>
      </div>
    </main>
  );
}
