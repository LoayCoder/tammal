import { AnimatedSection } from "./AnimatedSection";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqKeys = [
  { qKey: "landing.faq.q1", aKey: "landing.faq.a1" },
  { qKey: "landing.faq.q2", aKey: "landing.faq.a2" },
  { qKey: "landing.faq.q3", aKey: "landing.faq.a3" },
  { qKey: "landing.faq.q4", aKey: "landing.faq.a4" },
];

export const LandingFAQ = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-24 lg:py-32 bg-white">
      <div className="w-full max-w-3xl mx-auto px-6 lg:px-12">
        <AnimatedSection className="text-center mb-16">
          <p className="text-xs uppercase tracking-[0.2em] text-teal-600 mb-4 font-body font-medium">
            {t("landing.faq.sectionLabel")}
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-navy-900 tracking-tight font-display">
            {t("landing.faq.heading")}
          </h2>
        </AnimatedSection>

        <div className="space-y-4">
          {faqKeys.map((faq, i) => (
            <AnimatedSection key={faq.qKey} delay={i * 0.08}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full text-start p-6 rounded-2xl border border-gray-200/80 bg-white hover:border-teal-200 transition-all duration-300"
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-sm font-semibold text-navy-900 font-display">
                    {t(faq.qKey)}
                  </h3>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-300 ${open === i ? "rotate-180" : ""}`}
                    strokeWidth={1.5}
                  />
                </div>
                <div
                  className={`overflow-hidden transition-all duration-300 ${open === i ? "max-h-40 mt-3" : "max-h-0"}`}
                >
                  <p className="text-sm text-gray-500 leading-relaxed font-body">
                    {t(faq.aKey)}
                  </p>
                </div>
              </button>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};
