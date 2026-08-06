import React, { useEffect } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import LandingNav from "../components/landing/LandingNav";
import HeroSection from "../components/landing/HeroSection";
import { ProblemSection } from "../components/landing/StorySections";
import NexoraWaySection from "../components/landing/NexoraWaySection";
import LaptopShowcase from "../components/landing/LaptopShowcase";
import FeatureShowcaseSection from "../components/landing/FeatureShowcaseSection";
import { PricingSection, FaqSection } from "../components/landing/SocialProof";
import { FinalCTA, LandingFooter } from "../components/landing/FinalCTA";

/**
 * Nexora marketing landing page - the public front door.
 *
 * A cinematic, scroll-driven product story built on the Nexora design system
 * (Geist type, theme-aware blue/emerald brand palette, animated brand mark).
 * Every section is composed from the shared landing primitives, so motion,
 * spacing and reveal behaviour stay consistent - and everything degrades
 * gracefully under prefers-reduced-motion.
 */
const LandingPage: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  // Smooth in-page anchor scrolling for the nav links.
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.scrollBehavior;
    html.style.scrollBehavior = "smooth";
    return () => {
      html.style.scrollBehavior = prev;
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[var(--app-bg)] text-gray-900 antialiased dark:text-white">
      {/* Scroll progress bar */}
      <motion.div
        style={{ scaleX: progress }}
        className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500"
      />

      <LandingNav />

      <main>
        <HeroSection />
        <LaptopShowcase />
        <ProblemSection />
        <NexoraWaySection />
        <FeatureShowcaseSection />
        <PricingSection />
        <FaqSection />
        <FinalCTA />
      </main>

      <LandingFooter />
    </div>
  );
};

export default LandingPage;
