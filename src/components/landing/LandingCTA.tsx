import { AnimatedSection } from "./AnimatedSection";
import { ArrowRight } from "lucide-react";

export const LandingCTA = () => (
  <section id="contact" className="py-24 lg:py-32">
    <div className="w-full max-w-3xl mx-auto px-6 lg:px-12 text-center">
      <AnimatedSection>
        <div className="relative">
          {/* Radial spotlight */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.08)_0%,transparent_70%)] pointer-events-none rounded-2xl" />
          
          {/* Animated border container */}
          <div className="p-px rounded-2xl bg-gradient-to-br from-white/[0.1] via-white/[0.04] to-white/[0.1] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/[0.08] via-transparent to-violet-500/[0.08] animate-[spin_8s_linear_infinite] origin-center opacity-50" />
            <div className="p-12 lg:p-16 rounded-[15px] bg-[#0A0E1A] relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/[0.04] to-violet-600/[0.04] pointer-events-none rounded-[15px]" />
              <div className="relative space-y-6">
                <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
                  Experience the Platform
                </h2>
                <p className="text-sm text-white/40 max-w-md mx-auto leading-relaxed">
                  Join the enterprises transforming their employee experience with AI-powered intelligence.
                </p>
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <a
                    href="mailto:info@dhuud.com"
                    className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-white text-[#0A0E1A] font-semibold text-sm hover:bg-blue-50 transition-all duration-300"
                  >
                    Request Private Access
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                  </a>
                  <a
                    href="/auth"
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg border border-white/[0.12] text-white/70 font-medium text-sm hover:bg-white/[0.06] hover:border-white/[0.2] transition-all duration-300"
                  >
                    Sign In
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
