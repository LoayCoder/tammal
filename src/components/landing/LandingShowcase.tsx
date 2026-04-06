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
    <section id="showcase" className="py-24 lg:py-32">
      <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 space-y-20 lg:space-y-28">
        {showcaseItems.map((item, i) => (
          <div key={item.titleKey} className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <AnimatedSection delay={0}>
              <div className={i % 2 === 1 ? "lg:order-last" : ""}>
                <p className="text-[11px] uppercase tracking-[0.2em] text-blue-400/60 mb-3 relative inline-block">
                  0{i + 1}
                  <span className="absolute -inset-2 bg-blue-500/[0.06] rounded-full blur-lg -z-10" />
                </p>
                <h3 className="text-2xl lg:text-3xl font-bold text-white tracking-tight mb-4">{t(item.titleKey)}</h3>
                <p className="text-sm text-white/40 leading-relaxed max-w-md">{t(item.descKey)}</p>
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
