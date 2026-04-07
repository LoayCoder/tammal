import { AnimatedSection } from "./AnimatedSection";
import { BrowserFrame } from "./BrowserFrame";
import { useTranslation } from "react-i18next";

export const LandingVisual = () => {
  const { t } = useTranslation();

  return (
    <section className="py-24 lg:py-32 bg-white">
      <div className="w-full max-w-6xl mx-auto px-6 lg:px-12">
        <AnimatedSection className="text-center mb-14">
          <p className="text-xs uppercase tracking-[0.2em] text-teal-600 mb-4 font-body font-medium">
            {t("landing.visual.sectionLabel")}
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-navy-900 tracking-tight mb-4 font-display">
            {t("landing.visual.heading")}
          </h2>
          <p className="text-sm text-gray-500 max-w-lg mx-auto font-body">
            {t("landing.visual.subtitle")}
          </p>
        </AnimatedSection>
        <AnimatedSection delay={0.15}>
          <div className="relative">
            <div className="absolute -bottom-8 inset-x-12 h-32 bg-navy-900/5 rounded-full blur-[60px] pointer-events-none" />
            <div className="hidden lg:block absolute -end-8 -top-6 w-[45%] z-0 opacity-60" style={{ transform: "perspective(1200px) rotateY(-2deg)" }}>
              <BrowserFrame title="tammal.app/pulse">
                <img
                  src="/screenshots/team-pulse.png"
                  alt="Team Pulse — mood distribution and weekly activity"
                  className="w-full h-auto"
                  loading="lazy"
                />
              </BrowserFrame>
            </div>
            <div className="relative z-10">
              <BrowserFrame title="tammal.app/executive">
                <img
                  src="/screenshots/executive-dashboard.png"
                  alt="Executive Dashboard — organization wellness analytics"
                  className="w-full h-auto"
                  loading="lazy"
                />
              </BrowserFrame>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};
