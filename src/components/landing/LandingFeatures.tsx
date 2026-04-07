import { useTranslation } from "react-i18next";

const featureKeys = [
  { titleKey: "landing.features.f1Title", descKey: "landing.features.f1Desc" },
  { titleKey: "landing.features.f2Title", descKey: "landing.features.f2Desc" },
  { titleKey: "landing.features.f3Title", descKey: "landing.features.f3Desc" },
  { titleKey: "landing.features.f4Title", descKey: "landing.features.f4Desc" },
  { titleKey: "landing.features.f5Title", descKey: "landing.features.f5Desc" },
  { titleKey: "landing.features.f6Title", descKey: "landing.features.f6Desc" },
];

export const LandingFeatures = () => {
  const { t } = useTranslation();

  return (
    <section id="features" className="py-24 lg:py-[100px] bg-white">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-[48px] font-bold text-black tracking-[-1px] leading-tight mb-4">
            {t("landing.features.heading")}
          </h2>
          <p className="text-lg text-[#666] max-w-lg mx-auto">
            {t("landing.features.subtitle")}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-12">
          {featureKeys.map((f) => (
            <div key={f.titleKey}>
              <h3 className="text-xl font-bold text-black mb-2">
                {t(f.titleKey)}
              </h3>
              <p className="text-[15px] text-[#666] leading-relaxed">
                {t(f.descKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
