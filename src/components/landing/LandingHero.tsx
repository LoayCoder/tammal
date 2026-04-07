import { motion } from "framer-motion";
import { BrowserFrame } from "./BrowserFrame";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

export const LandingHero = () => {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-screen flex items-center pt-20 pb-24 overflow-hidden bg-white">
      {/* Subtle ambient gradient */}
      <div className="absolute top-0 inset-x-0 h-full bg-gradient-to-b from-[#f0f4f8] to-white pointer-events-none" />
      <div className="absolute top-1/3 end-0 w-[500px] h-[500px] bg-teal-100/30 rounded-full blur-[150px] pointer-events-none" />

      <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 relative">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-teal-200 bg-teal-50 text-[11px] text-teal-700 tracking-wide uppercase font-medium font-body">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
              {t("landing.hero.badge")}
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-navy-900 leading-[1.08] font-display">
              {t("landing.hero.headingLine1")}
              <br />
              <span className="text-teal-600">
                {t("landing.hero.headingLine2")}
              </span>
            </h1>

            <p className="text-lg text-gray-500 max-w-lg leading-relaxed font-body">
              {t("landing.hero.subtitle")}
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <a
                href="#contact"
                className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-lg bg-navy-900 text-white font-semibold text-sm hover:bg-navy-800 transition-all duration-300 font-body"
              >
                {t("landing.hero.cta")}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
              </a>
              <a
                href="/auth"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg border border-gray-300 text-navy-900 font-medium text-sm hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 font-body"
              >
                {t("landing.hero.signIn")}
              </a>
            </div>
          </motion.div>

          {/* Screenshot */}
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <BrowserFrame>
              <img
                src="/screenshots/dashboard.png"
                alt="Tammal Admin Platform — Dashboard overview"
                className="w-full h-auto"
                loading="eager"
              />
            </BrowserFrame>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
