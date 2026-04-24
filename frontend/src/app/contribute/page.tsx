import type { Metadata } from "next";

import { ContributeView } from "@/components/contribute/contribute-view";

export const metadata: Metadata = {
  title: "Contribute",
  description:
    "Submit contribution receipts on IPFS; owners assign revenue share in basis points. Pull-payment withdrawals per post.",
};

export default function ContributePage() {
  return (
    <main className="min-h-[70vh]">
      <ContributeView />
    </main>
  );
}
