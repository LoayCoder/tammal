import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import tammalLogo from "@/assets/tammal-logo.svg";
import { LandingHero } from "./LandingHero";
import { LandingFeatures } from "./LandingFeatures";
import { LandingShowcase } from "./LandingShowcase";
import { LandingStats } from "./LandingStats";
import { LandingCTA } from "./LandingCTA";

const LandingNav = () => {
  const [scrolled, setScrolled] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/[0.98] backdrop-blur-xl border-b border-black/[0.08]"
          : "bg-transparent border-b border-transparent"
      }`}
      style={{ height: 56 }}
    >
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 h-full flex items-center justify-between">
        <a href="/" className="flex items-center">
          <img src={tammalLogo} alt="Tammal" className="h-6" />
        </a>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-black/70 hover:opacity-60 transition-opacity duration-200">
            {t("landing.nav.features")}
          </a>
          <a href="#showcase" className="text-sm text-black/70 hover:opacity-60 transition-opacity duration-200">
            {t("landing.nav.enterprise")}
          </a>
          <a href="#stats" className="text-sm text-black/70 hover:opacity-60 transition-opacity duration-200">
            {t("landing.nav.pricing")}
          </a>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="/auth"
            className="text-sm text-black/70 hover:opacity-60 transition-opacity duration-200"
          >
            {t("landing.nav.signIn")}
          </a>
          <a
            href="mailto:info@dhuud.com"
            className="px-4 py-2 rounded-md bg-black text-white text-sm font-medium hover:bg-[#1d1d1d] transition-colors duration-200"
          >
            {t("landing.nav.getStarted")}
          </a>
        </div>
      </div>
    </nav>
  );
};

const LandingFooter = () => {
  const { t } = useTranslation();

  return (
    <footer className="py-8 bg-[#f5f5f7] border-t border-black/[0.08]">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 text-center">
        <p className="text-[13px] text-[#666]">
          {t("landing.footer.rights", { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
};

const LandingPage = () => (
  <div className="min-h-screen bg-white text-black antialiased selection:bg-cyan-500/20" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif" }}>
    <LandingNav />
    <LandingHero />
    <LandingFeatures />
    <LandingShowcase />
    <LandingStats />
    <LandingCTA />
    <LandingFooter />
  </div>
);

export default LandingPage;
