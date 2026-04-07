import { AnimatedSection } from "./AnimatedSection";
import { Users, ShieldCheck, LineChart } from "lucide-react";
import { useTranslation } from "react-i18next";

export const LandingUseCases = () => {
  const { t } = useTranslation();

  const cases = [
    {
      icon: Users,
      titleKey: "landing.useCases.case1Title",
      descKey: "landing.useCases.case1Desc",
    },
    {
      icon: ShieldCheck,
      titleKey: "landing.useCases.case2Title",
      descKey: "landing.useCases.case2Desc",
    },
    {
      icon: LineChart,
      titleKey: "landing.useCases.case3Title",
      descKey: "landing.useCases.case3Desc",
    },
  ];

  return (
    <section className="py-24 lg:py-32 bg-[#f9fafb]">
      <div className="w-full max-w-7xl mx-auto px-6 lg:px-12">
        <AnimatedSection className="text-center mb-16">
          <p className="text-xs uppercase tracking-[0.2em] text-teal-600 mb-4 font-body font-medium">
            {t("landing.useCases.sectionLabel")}
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-navy-900 tracking-tight font-display">
            {t("landing.useCases.heading")}
          </h2>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-8">
          {cases.map((c, i) => (
            <AnimatedSection key={c.titleKey} delay={i * 0.12}>
              <div className="p-8 rounded-2xl border border-gray-200/80 bg-white hover:border-teal-200 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 h-full">
                <div className="w-12 h-12 rounded-xl bg-navy-900 flex items-center justify-center mb-6">
                  <c.icon className="w-5 h-5 text-teal-400" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold text-navy-900 mb-3 font-display">{t(c.titleKey)}</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-body">{t(c.descKey)}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};
