import { HeroSection } from "@/components/home/hero-section";
import { HowItWorks } from "@/components/home/how-it-works";
import { ProductPillars } from "@/components/home/product-pillars";
import { TeaserSection } from "@/components/home/teaser-section";
import { TrustStrip } from "@/components/home/trust-strip";

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <ProductPillars />
      <HowItWorks />
      <TrustStrip />
      <TeaserSection />
    </main>
  );
}
