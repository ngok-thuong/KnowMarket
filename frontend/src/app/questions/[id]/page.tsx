import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BountyQuestionDetail } from "@/components/questions/bounty-question-detail";
import { bountyPlaceholderIds, getBountyPlaceholderById } from "@/lib/bounty-placeholder";

type PageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return bountyPlaceholderIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const q = getBountyPlaceholderById(id);
  if (!q) return { title: "Question" };
  const short = q.title.length > 52 ? `${q.title.slice(0, 52)}…` : q.title;
  return {
    title: `${short} · Bounty Q&A`,
    description: q.excerpt,
  };
}

export default async function BountyQuestionPage({ params }: PageProps) {
  const { id } = await params;
  const question = getBountyPlaceholderById(id);
  if (!question) notFound();

  return (
    <main>
      <BountyQuestionDetail question={question} />
    </main>
  );
}
