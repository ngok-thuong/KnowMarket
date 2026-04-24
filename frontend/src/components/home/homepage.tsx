"use client";

import { useEffect, useState } from "react";

import { HeroSection } from "@/components/home/hero-section";
import { ProductPillars } from "@/components/home/product-pillars";
import { HowItWorks } from "@/components/home/how-it-works";
import { TrustStrip } from "@/components/home/trust-strip";
import { StatsStrip } from "@/components/home/stats-strip";
import { FinalCTA } from "@/components/home/final-cta";
import { HomeSplash, shouldShowHomeSplash } from "@/components/home/home-splash";
import { BlockchainBackground } from "@/components/home/blockchain-background";

export function HomePageClient() {
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    setShowSplash(shouldShowHomeSplash());
  }, []);

  return (
    <>
      {/* Fixed canvas sits behind everything */}
      <BlockchainBackground />

      <main className="relative z-10">
        {showSplash ? <HomeSplash onDone={() => setShowSplash(false)} /> : null}
        <HeroSection />
        <ProductPillars />
        <HowItWorks />
        <TrustStrip />
        <StatsStrip />
        <FinalCTA />
      </main>
    </>
  );
}
