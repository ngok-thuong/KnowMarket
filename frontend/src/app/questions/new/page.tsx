import type { Metadata } from "next";

import { NewBountyView } from "@/components/questions/new-bounty-view";

export const metadata: Metadata = {
  title: "New bounty",
  description: "Draft a USDC bounty question — on-chain createQuestion flow ships in a later milestone.",
};

type PageProps = {
  searchParams: Promise<{ q?: string | string[] }>;
};

export default async function NewBountyPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const raw = sp.q;
  const initialBody =
    typeof raw === "string" ? raw : Array.isArray(raw) && raw[0] ? raw[0] : "";

  return (
    <main className="min-h-[70vh]">
      <NewBountyView initialBody={initialBody} />
    </main>
  );
}
