import { useTranslation } from "react-i18next";

export const LandingHero = () => {
  const { t } = useTranslation();

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-[#f5f5f7]">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 text-center py-40">
        <p className="text-[13px] uppercase tracking-[0.15em] text-cyan-600 font-medium mb-6">
          {t("landing.hero.badge")}
        </p>

        <h1 className="text-4xl sm:text-5xl lg:text-[64px] font-bold text-black leading-[1.08] tracking-[-1.5px] mb-6 max-w-3xl mx-auto">
          {t("landing.hero.heading")}
        </h1>

        <p className="text-lg text-[#666] max-w-xl mx-auto leading-relaxed mb-10">
          {t("landing.hero.subtitle")}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="mailto:info@dhuud.com"
            className="px-8 py-3 rounded-md bg-black text-white text-[15px] font-medium hover:bg-[#1d1d1d] transition-colors duration-200"
          >
            {t("landing.hero.cta")}
          </a>
          <a
            href="#showcase"
            className="px-8 py-3 rounded-md border border-black/20 text-black text-[15px] font-medium hover:border-black/40 transition-colors duration-200"
          >
            {t("landing.hero.secondary")}
          </a>
        </div>
      </div>
    </section>
  );
};
