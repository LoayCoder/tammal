import { AnimatedSection } from "./AnimatedSection";
import { BrowserFrame } from "./BrowserFrame";

const showcaseItems = [
  {
    title: "Real-Time Executive Dashboard",
    desc: "Unified view of employee wellness, engagement metrics, and organizational health — updated in real-time with AI-powered anomaly detection.",
    screenshot: "/screenshots/analytics.png",
    alt: "Check-in Monitor — participation, mood trends, and engagement analytics",
  },
  {
    title: "Workload Intelligence Engine",
    desc: "Automated task distribution, capacity planning, and OKR tracking that prevents burnout before it happens.",
    screenshot: "/screenshots/workload.png",
    alt: "My Workload — task list, capacity gauge, and daily planner",
  },
  {
    title: "AI Wellness Copilot",
    desc: "Context-aware AI that proactively identifies wellness risks, suggests interventions, and provides evidence-based recommendations.",
    screenshot: "/screenshots/copilot.png",
    alt: "Wellness Copilot — AI-powered insights and recommended actions",
  },
];

export const LandingShowcase = () => (
  <section id="showcase" className="py-24 lg:py-32">
    <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 space-y-20 lg:space-y-28">
      {showcaseItems.map((item, i) => (
        <div key={item.title} className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Text — always first in DOM for accessibility */}
          <AnimatedSection delay={0}>
            <div className={i % 2 === 1 ? "lg:order-last" : ""}>
              <p className="text-[11px] uppercase tracking-[0.2em] text-blue-400/60 mb-3 relative inline-block">
                0{i + 1}
                <span className="absolute -inset-2 bg-blue-500/[0.06] rounded-full blur-lg -z-10" />
              </p>
              <h3 className="text-2xl lg:text-3xl font-bold text-white tracking-tight mb-4">{item.title}</h3>
              <p className="text-sm text-white/40 leading-relaxed max-w-md">{item.desc}</p>
            </div>
          </AnimatedSection>
          {/* Screenshot with staggered delay */}
          <AnimatedSection delay={0.2}>
            <div className={i % 2 === 1 ? "lg:order-first" : ""}>
              <BrowserFrame>
                <img
                  src={item.screenshot}
                  alt={item.alt}
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
