import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PostDetail } from "@/components/posts/post-detail";
import { getPostPlaceholderById, postPlaceholderIds } from "@/lib/posts-placeholder";

type PageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return postPlaceholderIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const post = getPostPlaceholderById(id);
  if (!post) return { title: "Post" };
  const short = post.title.length > 52 ? `${post.title.slice(0, 52)}…` : post.title;
  return {
    title: `${short} · Posts`,
    description: post.excerpt,
  };
}

export default async function PostPage({ params }: PageProps) {
  const { id } = await params;
  const post = getPostPlaceholderById(id);
  if (!post) notFound();

  return (
    <main>
      <PostDetail post={post} />
    </main>
  );
}
