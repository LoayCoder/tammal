import { AnimatedSection } from "./AnimatedSection";
import { Shield, Zap, Eye } from "lucide-react";
import { useTranslation } from "react-i18next";

export const LandingValue = () => {
  const { t } = useTranslation();

  const values = [
    {
      icon: Shield,
      titleKey: "landing.value.securityTitle",
      descKey: "landing.value.securityDesc",
    },
    {
      icon: Zap,
      titleKey: "landing.value.speedTitle",
      descKey: "landing.value.speedDesc",
    },
    {
      icon: Eye,
      titleKey: "landing.value.visibilityTitle",
      descKey: "landing.value.visibilityDesc",
    },
  ];

  return (
    <section className="py-24 lg:py-32 bg-[#f9fafb]">
      <div className="w-full max-w-7xl mx-auto px-6 lg:px-12">
        <AnimatedSection className="text-center mb-16">
          <p className="text-xs uppercase tracking-[0.2em] text-teal-600 mb-4 font-body font-medium">
            {t("landing.value.sectionLabel")}
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-navy-900 tracking-tight font-display">
            {t("landing.value.heading")}
          </h2>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-8">
          {values.map((v, i) => (
            <AnimatedSection key={v.titleKey} delay={i * 0.12}>
              <div className="group relative p-8 rounded-2xl bg-white border border-gray-200/80 hover:border-teal-200 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-navy-900 flex items-center justify-center mb-6">
                  <v.icon className="w-5 h-5 text-teal-400" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold text-navy-900 mb-3 font-display">{t(v.titleKey)}</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-body">{t(v.descKey)}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};
