import type { Metadata } from "next";

import { PostsFeedView } from "@/components/posts/posts-feed-view";

export const metadata: Metadata = {
  title: "Knowledge posts",
  description: "Free and premium knowledge posts — premium ciphertext on IPFS, keys after on-chain access.",
};

export default function PostsPage() {
  return (
    <main className="min-h-[70vh]">
      <PostsFeedView />
    </main>
  );
}
