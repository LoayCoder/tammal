import { AnimatedSection } from "./AnimatedSection";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

export const LandingCTA = () => {
  const { t } = useTranslation();

  return (
    <section id="contact" className="py-24 lg:py-32 bg-white">
      <div className="w-full max-w-3xl mx-auto px-6 lg:px-12 text-center">
        <AnimatedSection>
          <div className="p-12 lg:p-16 rounded-3xl bg-navy-900 relative overflow-hidden">
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-teal-600/10 via-transparent to-navy-900 pointer-events-none" />
            <div className="relative space-y-6">
              <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight font-display">
                {t("landing.cta.heading")}
              </h2>
              <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed font-body">
                {t("landing.cta.subtitle")}
              </p>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <a
                  href="mailto:info@dhuud.com"
                  className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-teal-500 text-navy-900 font-semibold text-sm hover:bg-teal-400 transition-all duration-300 font-body"
                >
                  {t("landing.cta.requestAccess")}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                </a>
                <a
                  href="/auth"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg border border-white/20 text-white font-medium text-sm hover:bg-white/10 transition-all duration-300 font-body"
                >
                  {t("landing.cta.signIn")}
                </a>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};
