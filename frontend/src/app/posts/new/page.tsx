import type { Metadata } from "next";

import { NewPostView } from "@/components/posts/new-post-view";

export const metadata: Metadata = {
  title: "New post",
  description: "Compose a free or premium knowledge post — encryption and createPost ship in a later milestone.",
};

export default function NewPostPage() {
  return (
    <main className="min-h-[70vh]">
      <NewPostView />
    </main>
  );
}
