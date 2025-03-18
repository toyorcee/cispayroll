import { HeroSection } from "../components/home/HeroSection";
import { FeaturesSection } from "../components/home/FeaturesSection";
import { BenefitsSection } from "../components/home/BenefitsSection";
import { PricingSection } from "../components/home/PricingSection";
import { BackToTop } from "../components/shared/BackToTop";

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <BenefitsSection />
      <PricingSection />
      <BackToTop />
    </>
  );
}