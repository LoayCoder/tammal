import { LandingHero } from "./LandingHero";
import { LandingValue } from "./LandingValue";
import { LandingShowcase } from "./LandingShowcase";
import { LandingFeatures } from "./LandingFeatures";
import { LandingVisual } from "./LandingVisual";
import { LandingTrust } from "./LandingTrust";
import { LandingCTA } from "./LandingCTA";
import { ArrowRight } from "lucide-react";

const LandingNav = () => (
  <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-[#0A0E1A]/80 border-b border-white/[0.04]">
    <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
      <span className="text-lg font-bold text-white tracking-tight">TAMMAL</span>
      <a
        href="#contact"
        className="group inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-white/[0.12] text-white/70 text-sm font-medium hover:bg-white/[0.06] transition-all duration-300"
      >
        Get Access
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
      </a>
    </div>
  </nav>
);

const LandingFooter = () => (
  <footer className="py-12 border-t border-white/[0.04]">
    <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
      <span className="text-sm text-white/20">© {new Date().getFullYear()} Tammal. All rights reserved.</span>
      <div className="flex gap-6">
        {["Privacy", "Terms", "Security"].map((l) => (
          <a key={l} href="#" className="text-xs text-white/25 hover:text-white/50 transition-colors">{l}</a>
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
