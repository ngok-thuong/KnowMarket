import type { Metadata } from "next";

import { ContributeNewView } from "@/components/contribute/contribute-new-view";

export const metadata: Metadata = {
  title: "New contribution",
  description: "Submit a contribution artifact CID — submitContribution flow ships in a later milestone.",
};

export default function ContributeNewPage() {
  return (
    <main className="min-h-[70vh]">
      <ContributeNewView />
    </main>
  );
}
