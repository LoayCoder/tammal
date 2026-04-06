import { AnimatedSection } from "./AnimatedSection";
import { BrowserFrame } from "./BrowserFrame";

export const LandingVisual = () => (
  <section className="py-24 lg:py-32">
    <div className="w-full max-w-6xl mx-auto px-6 lg:px-12">
      <AnimatedSection className="text-center mb-12">
        <p className="text-[11px] uppercase tracking-[0.2em] text-white/30 mb-3">The Experience</p>
        <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight mb-4">
          Command Center for the Modern Enterprise
        </h2>
        <p className="text-sm text-white/40 max-w-lg mx-auto">
          Every insight, every metric, every team — unified in a single, elegant interface.
        </p>
      </AnimatedSection>
      <AnimatedSection delay={0.15}>
        <div className="relative">
          {/* Ambient glow beneath */}
          <div className="absolute -bottom-8 inset-x-12 h-32 bg-blue-600/[0.06] rounded-full blur-[60px] pointer-events-none" />
          
          {/* Back frame — hidden on mobile */}
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
          
          {/* Main frame */}
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
