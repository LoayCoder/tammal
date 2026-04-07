import { AnimatedSection } from "./AnimatedSection";
import {
  Shield, Users, Target, Sparkles,
  Calendar, BookOpen, Award, Lock,
} from "lucide-react";
import { useTranslation } from "react-i18next";

const featureKeys = [
  { icon: Shield, titleKey: "landing.features.wellnessTitle", descKey: "landing.features.wellnessDesc" },
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
    <section className="py-24 lg:py-32 bg-[#f9fafb]">
      <div className="w-full max-w-7xl mx-auto px-6 lg:px-12">
        <AnimatedSection className="text-center mb-16">
          <p className="text-xs uppercase tracking-[0.2em] text-teal-600 mb-4 font-body font-medium">
            {t("landing.features.sectionLabel")}
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-navy-900 tracking-tight font-display">
            {t("landing.features.heading")}
          </h2>
        </AnimatedSection>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featureKeys.map((f, i) => (
            <AnimatedSection key={f.titleKey} delay={i * 0.06}>
              <div className="group p-6 rounded-2xl bg-white border border-gray-200/80 hover:border-teal-200 hover:-translate-y-1 hover:shadow-md transition-all duration-300 h-full">
                <div className="w-10 h-10 rounded-lg bg-navy-900/5 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-navy-900/60 group-hover:text-teal-600 transition-colors duration-300" strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-semibold text-navy-900 mb-2 font-display">{t(f.titleKey)}</h3>
                <p className="text-xs text-gray-500 leading-relaxed font-body">{t(f.descKey)}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};
