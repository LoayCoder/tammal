import { useTranslation } from "react-i18next";

export const LandingShowcase = () => {
  const { t } = useTranslation();

  return (
    <section id="showcase" className="py-24 lg:py-[100px] bg-[#f5f5f7]">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <h2 className="text-3xl lg:text-[40px] font-bold text-black tracking-[-1px] leading-tight mb-5">
              {t("landing.showcase.heading")}
            </h2>
            <p className="text-base text-[#666] leading-relaxed mb-8 max-w-md">
              {t("landing.showcase.description")}
            </p>
            <a
              href="#features"
              className="text-[15px] font-medium text-cyan-600 hover:opacity-70 transition-opacity duration-200"
            >
              {t("landing.showcase.cta")} →
            </a>
          </div>
          <div>
            <img
              src="/screenshots/executive-dashboard.png"
              alt={t("landing.showcase.imageAlt")}
              className="w-full h-auto rounded-xl"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
