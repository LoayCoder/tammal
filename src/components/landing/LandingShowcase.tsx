import { AnimatedSection } from "./AnimatedSection";
import { BrowserFrame } from "./BrowserFrame";

const AnalyticsMockup = () => (
  <div className="p-5 space-y-3 min-h-[260px]">
    <div className="flex justify-between items-center">
      <p className="text-[11px] text-white/40">Engagement Analytics</p>
      <div className="flex gap-1.5">
        {["7D", "30D", "90D"].map((t) => (
          <span key={t} className={`text-[9px] px-2 py-0.5 rounded ${t === "30D" ? "bg-blue-500/20 text-blue-400" : "text-white/30"}`}>{t}</span>
        ))}
      </div>
    </div>
    <div className="bg-white/[0.03] rounded-lg p-4 border border-white/[0.06]">
      <div className="flex items-end gap-1 h-28">
        {[40, 55, 65, 50, 72, 68, 80, 75, 88, 82, 90, 95, 78, 92].map((h, i) => (
          <div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-violet-600/50 to-violet-400/30" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
    <div className="grid grid-cols-3 gap-2">
      {[
        { l: "Avg Score", v: "4.2" },
        { l: "Responses", v: "1,847" },
        { l: "Trend", v: "+12%" },
      ].map((s) => (
        <div key={s.l} className="bg-white/[0.03] rounded p-2 border border-white/[0.04]">
          <p className="text-[9px] text-white/30">{s.l}</p>
          <p className="text-sm font-semibold text-white/80">{s.v}</p>
        </div>
      ))}
    </div>
  </div>
);

const WorkflowMockup = () => (
  <div className="p-5 space-y-3 min-h-[260px]">
    <p className="text-[11px] text-white/40">Workload Intelligence</p>
    {[
      { name: "Strategic Review", status: "In Progress", pct: 72, color: "bg-blue-500" },
      { name: "Team Pulse Survey", status: "Scheduled", pct: 45, color: "bg-emerald-500" },
      { name: "AI Model Training", status: "Pending", pct: 20, color: "bg-violet-500" },
      { name: "Q4 OKR Alignment", status: "Complete", pct: 100, color: "bg-emerald-400" },
    ].map((t) => (
      <div key={t.name} className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.05]">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-white/70">{t.name}</span>
          <span className="text-[9px] text-white/30">{t.status}</span>
        </div>
        <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
          <div className={`h-full ${t.color}/60 rounded-full`} style={{ width: `${t.pct}%` }} />
        </div>
      </div>
    ))}
  </div>
);

const CopilotMockup = () => (
  <div className="p-5 space-y-3 min-h-[260px]">
    <p className="text-[11px] text-white/40">AI Wellness Copilot</p>
    <div className="space-y-2">
      <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.05] max-w-[80%]">
        <p className="text-[10px] text-white/30 mb-1">System</p>
        <p className="text-xs text-white/60">Based on pulse data, the Engineering team shows early signs of workload stress. Consider redistributing Q2 tasks.</p>
      </div>
      <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20 max-w-[75%] ms-auto">
        <p className="text-[10px] text-blue-400/60 mb-1">You</p>
        <p className="text-xs text-white/60">What specific indicators are you seeing?</p>
      </div>
      <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.05] max-w-[85%]">
        <p className="text-[10px] text-white/30 mb-1">Copilot</p>
        <p className="text-xs text-white/60">3 key signals: declining daily check-in scores (-0.8), increased overtime hours (+22%), and lower peer recognition activity.</p>
      </div>
    </div>
  </div>
);

const showcaseItems = [
  {
    title: "Real-Time Executive Dashboard",
    desc: "Unified view of employee wellness, engagement metrics, and organizational health — updated in real-time with AI-powered anomaly detection.",
    mockup: <AnalyticsMockup />,
  },
  {
    title: "Workload Intelligence Engine",
    desc: "Automated task distribution, capacity planning, and OKR tracking that prevents burnout before it happens.",
    mockup: <WorkflowMockup />,
  },
  {
    title: "AI Wellness Copilot",
    desc: "Context-aware AI that proactively identifies wellness risks, suggests interventions, and provides evidence-based recommendations.",
    mockup: <CopilotMockup />,
  },
];

export const LandingShowcase = () => (
  <section id="showcase" className="py-24 lg:py-32">
    <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 space-y-20 lg:space-y-28">
      {showcaseItems.map((item, i) => (
        <div key={item.title} className={`grid lg:grid-cols-2 gap-10 lg:gap-16 items-center`}>
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
              <BrowserFrame>{item.mockup}</BrowserFrame>
            </div>
          </AnimatedSection>
        </div>
      ))}
    </div>
  </section>
);
