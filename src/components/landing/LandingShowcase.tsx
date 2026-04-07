import { AnimatedSection } from "./AnimatedSection";
import { BrowserFrame } from "./BrowserFrame";
import { useTranslation } from "react-i18next";

const showcaseItems = [
  {
    titleKey: "landing.showcase.item1Title",
    descKey: "landing.showcase.item1Desc",
    altKey: "landing.showcase.item1Alt",
    screenshot: "/screenshots/analytics.png",
  },
  {
    titleKey: "landing.showcase.item2Title",
    descKey: "landing.showcase.item2Desc",
    altKey: "landing.showcase.item2Alt",
    screenshot: "/screenshots/workload.png",
  },
  {
    titleKey: "landing.showcase.item3Title",
    descKey: "landing.showcase.item3Desc",
    altKey: "landing.showcase.item3Alt",
    screenshot: "/screenshots/copilot.png",
  },
];

export const LandingShowcase = () => {
  const { t } = useTranslation();

  return (
    <section id="showcase" className="py-24 lg:py-32 bg-white">
      <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 space-y-24 lg:space-y-32">
        {showcaseItems.map((item, i) => (
          <div key={item.titleKey} className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <AnimatedSection delay={0}>
              <div className={i % 2 === 1 ? "lg:order-last" : ""}>
                <p className="text-xs uppercase tracking-[0.2em] text-teal-600 mb-4 font-body font-medium">
                  0{i + 1}
                </p>
                <h3 className="text-2xl lg:text-3xl font-bold text-navy-900 tracking-tight mb-4 font-display">
                  {t(item.titleKey)}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-md font-body">{t(item.descKey)}</p>
              </div>
            </AnimatedSection>
            <AnimatedSection delay={0.2}>
              <div className={i % 2 === 1 ? "lg:order-first" : ""}>
                <BrowserFrame>
                  <img
                    src={item.screenshot}
                    alt={t(item.altKey)}
                    className="w-full h-auto"
                    loading="lazy"
                  />
                </BrowserFrame>
              </div>
            </AnimatedSection>
          </div>
        ))}
      </div>
    </section>
  );
};
