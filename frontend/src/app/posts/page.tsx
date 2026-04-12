import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Knowledge posts",
  description: "Free and premium knowledge posts — premium ciphertext on IPFS, keys after on-chain access.",
};

export default function PostsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-wider text-brand-bright">Scaffolding</p>
      <h1 className="mt-2 text-3xl font-semibold text-paper">Posts</h1>
      <p className="mt-4 text-paper/55">
        Feed of free and premium posts. Premium content uses client-side XChaCha20-Poly1305 and an IPFS
        envelope; buyers decrypt after <code className="font-mono text-paper/70">AccessPurchased</code>{" "}
        is confirmed.
      </p>
      <Link href="/" className="mt-10 inline-block text-sm font-medium text-brand-bright hover:text-paper">
        ← Back home
      </Link>
    </main>
  );
}
