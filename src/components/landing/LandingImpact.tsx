import { AnimatedSection } from "./AnimatedSection";
import { useTranslation } from "react-i18next";

export const LandingImpact = () => {
  const { t } = useTranslation();

  const stats = [
    { valueKey: "landing.impact.stat1Value", labelKey: "landing.impact.stat1Label", detailKey: "landing.impact.stat1Detail" },
    { valueKey: "landing.impact.stat2Value", labelKey: "landing.impact.stat2Label", detailKey: "landing.impact.stat2Detail" },
    { valueKey: "landing.impact.stat3Value", labelKey: "landing.impact.stat3Label", detailKey: "landing.impact.stat3Detail" },
    { valueKey: "landing.impact.stat4Value", labelKey: "landing.impact.stat4Label", detailKey: "landing.impact.stat4Detail" },
  ];

  return (
    <section className="py-24 lg:py-32 bg-navy-900">
      <div className="w-full max-w-7xl mx-auto px-6 lg:px-12">
        <AnimatedSection className="text-center mb-16">
          <p className="text-xs uppercase tracking-[0.2em] text-teal-400 mb-4 font-body font-medium">
            {t("landing.impact.sectionLabel")}
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight font-display">
            {t("landing.impact.heading")}
          </h2>
        </AnimatedSection>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <AnimatedSection key={s.labelKey} delay={i * 0.1}>
              <div className="text-center space-y-3">
                <p className="text-4xl lg:text-5xl font-extrabold text-teal-400 tracking-tight font-display">
                  {t(s.valueKey)}
                </p>
                <p className="text-sm font-semibold text-white font-display">
                  {t(s.labelKey)}
                </p>
                <p className="text-xs text-gray-400 leading-relaxed font-body">
                  {t(s.detailKey)}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};
