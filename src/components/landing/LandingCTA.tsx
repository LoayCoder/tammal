import { useTranslation } from "react-i18next";

export const LandingCTA = () => {
  const { t } = useTranslation();

  return (
    <section className="py-24 lg:py-[100px] bg-white">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 text-center">
        <h2 className="text-3xl lg:text-[48px] font-bold text-black tracking-[-1px] leading-tight mb-4">
          {t("landing.cta.heading")}
        </h2>
        <p className="text-base text-[#666] max-w-md mx-auto mb-8">
          {t("landing.cta.subtitle")}
        </p>
        <a
          href="mailto:info@dhuud.com"
          className="inline-block px-8 py-3 rounded-md bg-black text-white text-[15px] font-medium hover:bg-[#1d1d1d] transition-colors duration-200"
        >
          {t("landing.cta.button")}
        </a>
      </div>
    </section>
  );
};
