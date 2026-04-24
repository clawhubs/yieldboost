import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DocsPageView from "@/components/docs/DocsPageView";
import {
  getDocNeighbors,
  getDocPage,
  getDocSlugs,
  getDocsRuntimeStatus,
  type DocSlug,
} from "@/lib/docs/content";

interface DocPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return getDocSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: DocPageProps): Promise<Metadata> {
  const { slug } = await params;

  if (!getDocSlugs().includes(slug as DocSlug)) {
    return {
      title: "Docs | YiledBoost Ai",
    };
  }

  const page = getDocPage(slug as DocSlug, getDocsRuntimeStatus());

  return {
    title: `${page.label} | Docs | YiledBoost Ai`,
    description: page.description,
  };
}

export default async function DocumentationPage({ params }: DocPageProps) {
  const { slug } = await params;

  if (!getDocSlugs().includes(slug as DocSlug)) {
    notFound();
  }

  const status = getDocsRuntimeStatus();
  const page = getDocPage(slug as DocSlug, status);
  const neighbors = getDocNeighbors(slug as DocSlug);

  return <DocsPageView page={page} previous={neighbors.previous} next={neighbors.next} />;
}
