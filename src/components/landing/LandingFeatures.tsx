import { AnimatedSection } from "./AnimatedSection";
import {
  Heart, Users, Target, Sparkles,
  Calendar, BookOpen, Award, Lock,
} from "lucide-react";
import { useTranslation } from "react-i18next";

const featureKeys = [
  { icon: Heart, titleKey: "landing.features.wellnessTitle", descKey: "landing.features.wellnessDesc" },
  { icon: Users, titleKey: "landing.features.teamPulseTitle", descKey: "landing.features.teamPulseDesc" },
  { icon: Target, titleKey: "landing.features.okrTitle", descKey: "landing.features.okrDesc" },
  { icon: Sparkles, titleKey: "landing.features.surveyTitle", descKey: "landing.features.surveyDesc" },
  { icon: Calendar, titleKey: "landing.features.spiritualTitle", descKey: "landing.features.spiritualDesc" },
  { icon: BookOpen, titleKey: "landing.features.recognitionTitle", descKey: "landing.features.recognitionDesc" },
  { icon: Award, titleKey: "landing.features.crisisTitle", descKey: "landing.features.crisisDesc" },
  { icon: Lock, titleKey: "landing.features.governanceTitle", descKey: "landing.features.governanceDesc" },
];

export const LandingFeatures = () => {
  const { t } = useTranslation();

  return (
    <section className="py-24 lg:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-50/30 to-transparent pointer-events-none" />
      <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 relative">
        <AnimatedSection className="text-center mb-16">
          <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400 mb-3">{t("landing.features.sectionLabel")}</p>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
            {t("landing.features.heading")}
          </h2>
        </AnimatedSection>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featureKeys.map((f, i) => (
            <AnimatedSection key={f.titleKey} delay={i * 0.06}>
              <div className="group p-5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:-translate-y-1 hover:shadow-md transition-all duration-300 h-full">
                <f.icon className="w-5 h-5 text-blue-600/70 group-hover:text-blue-600 transition-colors duration-300 mb-3" />
                <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{t(f.titleKey)}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{t(f.descKey)}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};
