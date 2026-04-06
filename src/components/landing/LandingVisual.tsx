import { AnimatedSection } from "./AnimatedSection";
import { BrowserFrame } from "./BrowserFrame";

const ExecutiveMockup = () => (
  <div className="p-6 space-y-4 min-h-[380px]">
    <div className="flex justify-between items-center">
      <div>
        <p className="text-sm font-semibold text-white/80">Executive Overview</p>
        <p className="text-[10px] text-white/30">Organization-wide insights · Live</p>
      </div>
      <div className="flex gap-2">
        <span className="text-[9px] px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">All Systems Healthy</span>
      </div>
    </div>
    <div className="grid grid-cols-4 gap-3">
      {[
        { l: "Total Employees", v: "2,847", c: "text-white/80" },
        { l: "Wellness Index", v: "8.4/10", c: "text-emerald-400" },
        { l: "Engagement Rate", v: "94.2%", c: "text-blue-400" },
        { l: "AI Actions Today", v: "1,203", c: "text-violet-400" },
      ].map((s) => (
        <div key={s.l} className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.05]">
          <p className="text-[9px] text-white/30 mb-1">{s.l}</p>
          <p className={`text-lg font-bold ${s.c}`}>{s.v}</p>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-5 gap-3">
      <div className="col-span-3 bg-white/[0.03] rounded-lg p-4 border border-white/[0.05]">
        <p className="text-[10px] text-white/30 mb-3">Department Health Map</p>
        <div className="grid grid-cols-4 gap-1.5">
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded"
              style={{
                backgroundColor: `rgba(${i % 3 === 0 ? "34,197,94" : i % 3 === 1 ? "59,130,246" : "168,85,247"}, ${0.15 + (i * 7 % 11) * 0.025})`,
              }}
            />
          ))}
        </div>
      </div>
      <div className="col-span-2 bg-white/[0.03] rounded-lg p-4 border border-white/[0.05]">
        <p className="text-[10px] text-white/30 mb-3">Risk Alerts</p>
        <div className="space-y-2">
          {[
            { t: "Burnout risk: Engineering", s: "warning" },
            { t: "Low response: Marketing", s: "info" },
            { t: "High overtime: Operations", s: "warning" },
          ].map((a) => (
            <div key={a.t} className="flex items-start gap-2">
              <span className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${a.s === "warning" ? "bg-amber-400" : "bg-blue-400"}`} />
              <p className="text-[10px] text-white/50">{a.t}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const TeamPulseMockup = () => (
  <div className="p-5 space-y-3 min-h-[240px]">
    <p className="text-[11px] text-white/40">Team Pulse · Live</p>
    <div className="grid grid-cols-3 gap-2">
      {[
        { t: "Engineering", v: "7.8", c: "text-emerald-400" },
        { t: "Marketing", v: "6.2", c: "text-amber-400" },
        { t: "Operations", v: "8.1", c: "text-blue-400" },
      ].map((d) => (
        <div key={d.t} className="bg-white/[0.03] rounded p-2.5 border border-white/[0.05]">
          <p className="text-[9px] text-white/30 mb-1">{d.t}</p>
          <p className={`text-base font-bold ${d.c}`}>{d.v}</p>
        </div>
      ))}
    </div>
    <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.05]">
      <div className="flex items-end gap-1 h-16">
        {[50, 60, 55, 70, 65, 80, 75, 85].map((h, i) => (
          <div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-emerald-600/40 to-emerald-400/20" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  </div>
);

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
              <TeamPulseMockup />
            </BrowserFrame>
          </div>
          
          {/* Main frame */}
          <div className="relative z-10">
            <BrowserFrame title="tammal.app/executive">
              <ExecutiveMockup />
            </BrowserFrame>
          </div>
        </div>
      </AnimatedSection>
    </div>
  </section>
);
