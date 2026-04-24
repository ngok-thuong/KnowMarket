import type { Metadata } from "next";

import { HomeJourney } from "@/components/home/home-journey";

export const metadata: Metadata = {
  title: "Learn",
  description: "A deep-dive explainer of KnowMarket’s architecture, trust model, and three core loops.",
};

export default function LearnPage() {
  return <HomeJourney />;
}

