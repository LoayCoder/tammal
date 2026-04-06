import { motion } from "framer-motion";
import { BrowserFrame } from "./BrowserFrame";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

export const LandingHero = () => {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-screen flex items-center pt-20 pb-16 overflow-hidden">
      {/* Dual ambient glows */}
      <div className="absolute top-1/4 end-0 w-[600px] h-[600px] bg-blue-600/[0.06] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 start-0 w-[500px] h-[500px] bg-violet-600/[0.04] rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="space-y-6"
          >
            {/* Shimmer badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.1] bg-white/[0.04] text-[11px] text-white/50 tracking-wide uppercase relative overflow-hidden">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {t("landing.hero.badge")}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent -translate-x-full animate-[shimmer_3s_ease-in-out_infinite]" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-white leading-[1.05]">
              {t("landing.hero.headingMain")}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-200">
                {t("landing.hero.headingAccent")}
              </span>
            </h1>
            {/* Accent line */}
            <div className="w-16 h-px bg-gradient-to-r from-blue-500/50 to-transparent" />
            <p className="text-lg text-white/50 max-w-md leading-relaxed">
              {t("landing.hero.subtitle")}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href="#contact"
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-[#0A0E1A] font-semibold text-sm hover:bg-blue-50 transition-all duration-300"
              >
                {t("landing.hero.requestAccess")}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
              </a>
              <a
                href="/auth"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-white/[0.12] text-white/70 font-medium text-sm hover:bg-white/[0.06] hover:border-white/[0.2] transition-all duration-300"
              >
                {t("landing.hero.enterPlatform")}
              </a>
            </div>
          </motion.div>

          {/* Screenshot with floating animation */}
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <BrowserFrame>
                <img
                  src="/screenshots/dashboard.png"
                  alt="Tammal Dashboard — Employee wellness overview"
                  className="w-full h-auto"
                  loading="eager"
                />
              </BrowserFrame>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
