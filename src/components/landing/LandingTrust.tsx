import { AnimatedSection } from "./AnimatedSection";
import { Shield, Server, Globe, Fingerprint } from "lucide-react";

const stats = [
  { value: "10,000+", label: "Tenants" },
  { value: "99.99%", label: "Uptime" },
  { value: "SOC 2", label: "Ready" },
  { value: "< 200ms", label: "Response" },
];

const trustItems = [
  { icon: Shield, title: "Enterprise Security", desc: "Row-level security, JWT-based tenant isolation, and complete audit trails on every operation." },
  { icon: Server, title: "Multi-Tenant Architecture", desc: "Designed for 10,000+ tenants with zero cross-contamination — every byte is isolated." },
  { icon: Globe, title: "RTL-Native & Bilingual", desc: "Full Arabic and English support with logical layout properties — no compromises." },
  { icon: Fingerprint, title: "Compliance Ready", desc: "GDPR-aligned data handling, soft-delete architecture, and immutable audit logs." },
];

export const LandingTrust = () => (
  <section className="py-24 lg:py-32 relative">
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent pointer-events-none" />
    <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 relative">
      <AnimatedSection className="text-center mb-16">
        <p className="text-[11px] uppercase tracking-[0.2em] text-white/30 mb-3">Trust & Security</p>
        <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
          Enterprise-Grade by Design
        </h2>
      </AnimatedSection>

      {/* Stats strip */}
      <AnimatedSection delay={0.1}>
        <div className="flex flex-wrap justify-center gap-8 lg:gap-16 mb-12 pb-12 border-b border-white/[0.06]">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl lg:text-3xl font-bold text-white tracking-tight">{s.value}</p>
              <p className="text-[11px] text-white/30 uppercase tracking-wider mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </AnimatedSection>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {trustItems.map((t, i) => (
          <AnimatedSection key={t.title} delay={0.15 + i * 0.1}>
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/[0.08] flex items-center justify-center mx-auto">
                <t.icon className="w-5 h-5 text-white/50" />
              </div>
              <h3 className="text-sm font-semibold text-white">{t.title}</h3>
              <p className="text-xs text-white/35 leading-relaxed">{t.desc}</p>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </div>
  </section>
);
