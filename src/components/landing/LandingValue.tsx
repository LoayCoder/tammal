import { AnimatedSection } from "./AnimatedSection";
import { Brain, BarChart3, Shield } from "lucide-react";

const values = [
  {
    icon: Brain,
    title: "Intelligent Operations",
    desc: "AI-driven workflows that learn, adapt, and optimize — from wellness check-ins to workload balancing.",
  },
  {
    icon: BarChart3,
    title: "Advanced Insights",
    desc: "Executive dashboards, predictive analytics, and real-time engagement metrics at your fingertips.",
  },
  {
    icon: Shield,
    title: "Executive Control",
    desc: "Enterprise-grade security, multi-tenant isolation, and complete governance over every data point.",
  },
];

export const LandingValue = () => (
  <section className="py-24 lg:py-32 relative">
    <div className="w-full max-w-7xl mx-auto px-6 lg:px-12">
      <AnimatedSection className="text-center mb-16">
        <p className="text-[11px] uppercase tracking-[0.2em] text-white/30 mb-3">Why Tammal</p>
        <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
          Built for the Enterprise
        </h2>
      </AnimatedSection>

      <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
        {values.map((v, i) => (
          <AnimatedSection key={v.title} delay={i * 0.12}>
            <div className="group p-6 lg:p-8 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:-translate-y-1 transition-all duration-300">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-5">
                <v.icon className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{v.title}</h3>
              <p className="text-sm text-white/40 leading-relaxed">{v.desc}</p>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </div>
  </section>
);
