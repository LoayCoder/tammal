import { AnimatedSection } from "./AnimatedSection";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

export const LandingCTA = () => {
  const { t } = useTranslation();

  return (
    <section id="contact" className="py-24 lg:py-32">
      <div className="w-full max-w-3xl mx-auto px-6 lg:px-12 text-center">
        <AnimatedSection>
          <div className="relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.06)_0%,transparent_70%)] pointer-events-none rounded-2xl" />
            <div className="p-px rounded-2xl bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 relative overflow-hidden">
              <div className="p-12 lg:p-16 rounded-[15px] bg-white relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-violet-50/50 pointer-events-none rounded-[15px]" />
                <div className="relative space-y-6">
                  <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
                    {t("landing.cta.heading")}
                  </h2>
                  <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
                    {t("landing.cta.subtitle")}
                  </p>
                  <div className="flex flex-wrap justify-center gap-3 pt-2">
                    <a
                      href="mailto:info@dhuud.com"
                      className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all duration-300"
                    >
                      {t("landing.cta.requestAccess")}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                    </a>
                    <a
                      href="/auth"
                      className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 hover:border-gray-300 transition-all duration-300"
                    >
                      {t("landing.cta.signIn")}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};
