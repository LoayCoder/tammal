import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
          ? "backdrop-blur-xl bg-white/90 border-b border-gray-200 shadow-sm"
          : "backdrop-blur-md bg-white/60 border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
        <span className="text-xl font-bold text-gray-900 tracking-[0.08em]">TAMMAL</span>
        <div className="flex items-center gap-3">
          <a
            href="/auth"
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors font-medium"
          >
            {t("landing.nav.signIn")}
          </a>
          <a
            href="#contact"
            className="group inline-flex items-center gap-1.5 px-5 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-300"
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
    <footer className="py-16 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-sm text-gray-400">
          {t("landing.footer.rights", { year: new Date().getFullYear() })}
        </span>
        <div className="flex gap-6">
          {footerLinks.map((l) => (
            <a
              key={l}
              href="#"
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors relative after:content-[''] after:absolute after:bottom-0 after:inset-x-0 after:h-px after:bg-gray-300 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300"
            >
              {l}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};

const LandingPage = () => (
  <div className="min-h-screen bg-white text-gray-900 antialiased selection:bg-blue-500/20">
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
