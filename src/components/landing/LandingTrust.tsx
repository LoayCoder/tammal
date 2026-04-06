import { AnimatedSection } from "./AnimatedSection";
import { Shield, Server, Globe, Fingerprint } from "lucide-react";
import { useTranslation } from "react-i18next";

const trustItemKeys = [
  { icon: Shield, titleKey: "landing.trust.securityTitle", descKey: "landing.trust.securityDesc" },
  { icon: Server, titleKey: "landing.trust.multiTenantTitle", descKey: "landing.trust.multiTenantDesc" },
  { icon: Globe, titleKey: "landing.trust.rtlTitle", descKey: "landing.trust.rtlDesc" },
  { icon: Fingerprint, titleKey: "landing.trust.complianceTitle", descKey: "landing.trust.complianceDesc" },
];

export const LandingTrust = () => {
  const { t } = useTranslation();

  const stats = [
    { valueKey: "landing.trust.stat1Value", labelKey: "landing.trust.stat1Label" },
    { valueKey: "landing.trust.stat2Value", labelKey: "landing.trust.stat2Label" },
    { valueKey: "landing.trust.stat3Value", labelKey: "landing.trust.stat3Label" },
    { valueKey: "landing.trust.stat4Value", labelKey: "landing.trust.stat4Label" },
  ];

  return (
    <section className="py-24 lg:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent pointer-events-none" />
      <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 relative">
        <AnimatedSection className="text-center mb-16">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/30 mb-3">{t("landing.trust.sectionLabel")}</p>
          <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
            {t("landing.trust.heading")}
          </h2>
        </AnimatedSection>

        <AnimatedSection delay={0.1}>
          <div className="flex flex-wrap justify-center gap-8 lg:gap-16 mb-12 pb-12 border-b border-white/[0.06]">
            {stats.map((s) => (
              <div key={s.labelKey} className="text-center">
                <p className="text-2xl lg:text-3xl font-bold text-white tracking-tight">{t(s.valueKey)}</p>
                <p className="text-[11px] text-white/30 uppercase tracking-wider mt-1">{t(s.labelKey)}</p>
              </div>
            ))}
          </div>
        </AnimatedSection>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustItemKeys.map((item, i) => (
            <AnimatedSection key={item.titleKey} delay={0.15 + i * 0.1}>
              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/[0.08] flex items-center justify-center mx-auto">
                  <item.icon className="w-5 h-5 text-white/50" />
                </div>
                <h3 className="text-sm font-semibold text-white">{t(item.titleKey)}</h3>
                <p className="text-xs text-white/35 leading-relaxed">{t(item.descKey)}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};
