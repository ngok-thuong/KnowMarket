import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContributeDetail } from "@/components/contribute/contribute-detail";
import { contributionPlaceholderIds, getContributionPlaceholderById } from "@/lib/contribute-placeholder";

type PageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return contributionPlaceholderIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const row = getContributionPlaceholderById(id);
  if (!row) return { title: "Contribution" };
  const short = row.postTitle.length > 48 ? `${row.postTitle.slice(0, 48)}…` : row.postTitle;
  return {
    title: `${short} · Contribute`,
    description: row.summary.slice(0, 160),
  };
}

export default async function ContributeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const row = getContributionPlaceholderById(id);
  if (!row) notFound();

  return (
    <main>
      <ContributeDetail row={row} />
    </main>
  );
}
