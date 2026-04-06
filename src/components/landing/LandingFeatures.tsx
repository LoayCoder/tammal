import { AnimatedSection } from "./AnimatedSection";
import {
  Heart, Users, Target, Sparkles,
  Calendar, BookOpen, Award, Lock,
} from "lucide-react";

const features = [
  { icon: Heart, title: "Wellness Ecosystem", desc: "Mental tools, breathing exercises, mood tracking, and spiritual wellness — all in one place." },
  { icon: Users, title: "Team Pulse", desc: "Real-time team sentiment analysis with AI-powered intervention suggestions." },
  { icon: Target, title: "OKR & Workload", desc: "Objective tracking, capacity planning, and automated task escalation." },
  { icon: Sparkles, title: "AI Survey Engine", desc: "Auto-generated questionnaires with bias detection and mood pathway analysis." },
  { icon: Calendar, title: "Spiritual Tracking", desc: "Prayer tracking, Quran reader, Sunnah tracker, and Islamic calendar integration." },
  { icon: BookOpen, title: "Recognition Hub", desc: "Nominations, voting, gamification, and fairness-audited award cycles." },
  { icon: Award, title: "Crisis First Aiders", desc: "Trained peer support network with escalation protocols and confidential channels." },
  { icon: Lock, title: "AI Governance", desc: "Cost controls, provider routing, sandbox evaluation, and full audit trails." },
];

export const LandingFeatures = () => (
  <section className="py-24 lg:py-32 relative">
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-600/[0.02] to-transparent pointer-events-none" />
    <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 relative">
      <AnimatedSection className="text-center mb-16">
        <p className="text-[11px] uppercase tracking-[0.2em] text-white/30 mb-3">Capabilities</p>
        <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
          Every Tool Your Organization Needs
        </h2>
      </AnimatedSection>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((f, i) => (
          <AnimatedSection key={f.title} delay={i * 0.06}>
            <div className="group p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm hover:bg-white/[0.05] hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(59,130,246,0.06)] transition-all duration-300 h-full">
              <f.icon className="w-5 h-5 text-blue-400/70 group-hover:text-blue-300 transition-colors duration-300 mb-3" />
              <h3 className="text-sm font-semibold text-white mb-1.5">{f.title}</h3>
              <p className="text-xs text-white/35 leading-relaxed">{f.desc}</p>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </div>
  </section>
);
