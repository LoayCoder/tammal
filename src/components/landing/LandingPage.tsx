import { useState, useEffect } from "react";
import { LandingHero } from "./LandingHero";
import { LandingValue } from "./LandingValue";
import { LandingShowcase } from "./LandingShowcase";
import { LandingFeatures } from "./LandingFeatures";
import { LandingVisual } from "./LandingVisual";
import { LandingTrust } from "./LandingTrust";
import { LandingCTA } from "./LandingCTA";
import { ArrowRight } from "lucide-react";

const LandingNav = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled
          ? "backdrop-blur-xl bg-[#0A0E1A]/90 border-b border-white/[0.06] shadow-[0_1px_20px_rgba(59,130,246,0.04)]"
          : "backdrop-blur-md bg-[#0A0E1A]/60 border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
        <span className="text-xl font-bold text-white tracking-[0.08em]">TAMMAL</span>
        <a
          href="#contact"
          className="group inline-flex items-center gap-1.5 px-5 py-2 rounded-lg border border-white/[0.12] text-white/70 text-sm font-medium hover:bg-white/[0.06] hover:border-white/[0.2] transition-all duration-300"
        >
          Get Access
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
        </a>
      </div>
    </nav>
  );
};

const LandingFooter = () => (
  <footer className="py-16 border-t border-white/[0.04]">
    <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
      <span className="text-sm text-white/20">© {new Date().getFullYear()} Tammal. All rights reserved.</span>
      <div className="flex gap-6">
        {["Privacy", "Terms", "Security"].map((l) => (
          <a
            key={l}
            href="#"
            className="text-xs text-white/25 hover:text-white/50 transition-colors relative after:content-[''] after:absolute after:bottom-0 after:inset-x-0 after:h-px after:bg-white/20 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300"
          >
            {l}
          </a>
        ))}
      </div>
    </div>
  </footer>
);

const LandingPage = () => (
  <div className="min-h-screen bg-[#0A0E1A] text-white antialiased selection:bg-blue-500/30">
    <LandingNav />
    <LandingHero />
    <LandingValue />
    <LandingShowcase />
    <LandingFeatures />
    <LandingVisual />
    <LandingTrust />
    <LandingCTA />
    <LandingFooter />
  </div>
);

export default LandingPage;
