import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import tammalLogo from "@/assets/tammal-logo.svg";
import { LandingHero } from "./LandingHero";
import { LandingValue } from "./LandingValue";
import { LandingShowcase } from "./LandingShowcase";
import { LandingFeatures } from "./LandingFeatures";
import { LandingImpact } from "./LandingImpact";
import { LandingVisual } from "./LandingVisual";
import { LandingTrust } from "./LandingTrust";
import { LandingUseCases } from "./LandingUseCases";
import { LandingFAQ } from "./LandingFAQ";
import { LandingCTA } from "./LandingCTA";
import { ArrowRight } from "lucide-react";

const LandingNav = () => {
  const [scrolled, setScrolled] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled
          ? "backdrop-blur-xl bg-white/95 border-b border-gray-200/80 shadow-sm"
          : "backdrop-blur-md bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
        <span className="text-xl font-bold tracking-[0.06em] font-display text-navy-900">
          TAMMAL
        </span>
        <div className="flex items-center gap-3">
          <a
            href="/auth"
            className="text-sm text-gray-500 hover:text-navy-900 transition-colors font-medium font-body"
          >
            {t("landing.nav.signIn")}
          </a>
          <a
            href="#contact"
            className="group inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-navy-900 text-white text-sm font-medium font-body hover:bg-navy-800 transition-all duration-300"
          >
            {t("landing.nav.getAccess")}
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
          </a>
        </div>
      </div>
    </nav>
  );
};

const LandingFooter = () => {
  const { t } = useTranslation();
  const footerLinks = [
    t("landing.footer.privacy"),
    t("landing.footer.terms"),
    t("landing.footer.security"),
  ];

  return (
    <footer className="py-16 border-t border-gray-200/60 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <span className="text-lg font-bold tracking-[0.06em] font-display text-navy-900">
              TAMMAL
            </span>
            <span className="text-sm text-gray-400 font-body">
              {t("landing.footer.rights", { year: new Date().getFullYear() })}
            </span>
          </div>
          <div className="flex gap-6">
            {footerLinks.map((l) => (
              <a
                key={l}
                href="#"
                className="text-xs text-gray-400 hover:text-navy-900 transition-colors font-body"
              >
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

const LandingPage = () => (
  <div className="min-h-screen bg-white text-gray-900 antialiased selection:bg-teal-500/20 font-body">
    <LandingNav />
    <LandingHero />
    <LandingValue />
    <LandingShowcase />
    <LandingFeatures />
    <LandingImpact />
    <LandingUseCases />
    <LandingVisual />
    <LandingTrust />
    <LandingFAQ />
    <LandingCTA />
    <LandingFooter />
  </div>
);

export default LandingPage;
