import { AnimatedSection } from "./AnimatedSection";
import { Brain, BarChart3, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";

export const LandingValue = () => {
  const { t } = useTranslation();

  const values = [
    {
      icon: Brain,
      titleKey: "landing.value.intelligentOps",
      descKey: "landing.value.intelligentOpsDesc",
    },
    {
      icon: BarChart3,
      titleKey: "landing.value.advancedInsights",
      descKey: "landing.value.advancedInsightsDesc",
    },
    {
      icon: Shield,
      titleKey: "landing.value.executiveControl",
      descKey: "landing.value.executiveControlDesc",
    },
  ];

  return (
    <section className="py-24 lg:py-32 relative">
      <div className="w-full max-w-7xl mx-auto px-6 lg:px-12">
        <AnimatedSection className="text-center mb-16">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/30 mb-3">
            {t("landing.value.sectionLabel")}
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
            {t("landing.value.heading")}
          </h2>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {values.map((v, i) => (
            <AnimatedSection key={v.titleKey} delay={i * 0.12}>
              <div className="group relative p-6 lg:p-8 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/[0.08] flex items-center justify-center mb-5">
                  <v.icon className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{t(v.titleKey)}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{t(v.descKey)}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};
