import { AnimatedSection } from "./AnimatedSection";
import { Building2, UserCheck, BarChart3 } from "lucide-react";
import { useTranslation } from "react-i18next";

export const LandingUseCases = () => {
  const { t } = useTranslation();

  const cases = [
    {
      icon: Building2,
      titleKey: "landing.useCases.case1Title",
      descKey: "landing.useCases.case1Desc",
    },
    {
      icon: UserCheck,
      titleKey: "landing.useCases.case2Title",
      descKey: "landing.useCases.case2Desc",
    },
    {
      icon: BarChart3,
      titleKey: "landing.useCases.case3Title",
      descKey: "landing.useCases.case3Desc",
    },
  ];

  return (
    <section className="py-24 lg:py-32 bg-navy-900">
      <div className="w-full max-w-7xl mx-auto px-6 lg:px-12">
        <AnimatedSection className="text-center mb-16">
          <p className="text-xs uppercase tracking-[0.2em] text-teal-400 mb-4 font-body font-medium">
            {t("landing.useCases.sectionLabel")}
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight font-display">
            {t("landing.useCases.heading")}
          </h2>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-8">
          {cases.map((c, i) => (
            <AnimatedSection key={c.titleKey} delay={i * 0.12}>
              <div className="p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 h-full">
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center mb-6">
                  <c.icon className="w-5 h-5 text-teal-400" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-3 font-display">{t(c.titleKey)}</h3>
                <p className="text-sm text-gray-400 leading-relaxed font-body">{t(c.descKey)}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};
