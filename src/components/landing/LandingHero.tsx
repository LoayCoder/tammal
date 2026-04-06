import { motion } from "framer-motion";
import { BrowserFrame } from "./BrowserFrame";
import { ArrowRight } from "lucide-react";

const DashboardMockup = () => (
  <div className="p-6 space-y-4 min-h-[320px]">
    <div className="grid grid-cols-3 gap-3">
      {[
        { label: "Employee Wellness", val: "87%", color: "bg-emerald-500/20 text-emerald-400" },
        { label: "Response Rate", val: "94%", color: "bg-blue-500/20 text-blue-400" },
        { label: "Engagement Score", val: "4.6", color: "bg-violet-500/20 text-violet-400" },
      ].map((s) => (
        <div key={s.label} className="bg-white/[0.04] rounded-lg p-3 border border-white/[0.06]">
          <p className="text-[10px] text-white/40 mb-1">{s.label}</p>
          <p className={`text-lg font-bold ${s.color}`}>{s.val}</p>
        </div>
      ))}
    </div>
    <div className="bg-white/[0.03] rounded-lg p-4 border border-white/[0.06]">
      <p className="text-[11px] text-white/40 mb-3">Weekly Pulse Trend</p>
      <div className="flex items-end gap-1.5 h-24">
        {[60, 75, 55, 80, 70, 90, 85, 78, 92, 68, 88, 95].map((h, i) => (
          <div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-blue-600/60 to-blue-400/40" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06]">
        <p className="text-[10px] text-white/40 mb-2">AI Copilot Insight</p>
        <div className="space-y-1.5">
          <div className="h-2 bg-white/[0.08] rounded w-full" />
          <div className="h-2 bg-white/[0.06] rounded w-3/4" />
          <div className="h-2 bg-white/[0.05] rounded w-1/2" />
        </div>
      </div>
      <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06]">
        <p className="text-[10px] text-white/40 mb-2">Team Health</p>
        <div className="flex gap-1 mt-1">
          {["bg-emerald-500/60", "bg-emerald-500/50", "bg-yellow-500/50", "bg-emerald-500/40", "bg-emerald-500/60"].map((c, i) => (
            <div key={i} className={`h-8 flex-1 rounded ${c}`} />
          ))}
        </div>
      </div>
    </div>
  </div>
);

export const LandingHero = () => (
  <section className="relative min-h-screen flex items-center pt-20 pb-16 overflow-hidden">
    {/* Dual ambient glows */}
    <div className="absolute top-1/4 end-0 w-[600px] h-[600px] bg-blue-600/[0.06] rounded-full blur-[120px] pointer-events-none" />
    <div className="absolute bottom-1/4 start-0 w-[500px] h-[500px] bg-violet-600/[0.04] rounded-full blur-[140px] pointer-events-none" />
    
    <div className="w-full max-w-7xl mx-auto px-6 lg:px-12">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="space-y-6"
        >
          {/* Shimmer badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.1] bg-white/[0.04] text-[11px] text-white/50 tracking-wide uppercase relative overflow-hidden">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Enterprise AI Platform
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent -translate-x-full animate-[shimmer_3s_ease-in-out_infinite]" />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-white leading-[1.05]">
            Enterprise Intelligence,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-200">
              Elevated.
            </span>
          </h1>
          {/* Accent line */}
          <div className="w-16 h-px bg-gradient-to-r from-blue-500/50 to-transparent" />
          <p className="text-lg text-white/50 max-w-md leading-relaxed">
            The AI-powered platform that transforms employee wellness, engagement, and performance into strategic advantage.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href="#contact"
              className="group inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-[#0A0E1A] font-semibold text-sm hover:bg-blue-50 transition-all duration-300"
            >
              Request Private Access
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
            </a>
            <a
              href="#showcase"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-white/[0.12] text-white/70 font-medium text-sm hover:bg-white/[0.06] hover:border-white/[0.2] transition-all duration-300"
            >
              Explore Platform
            </a>
          </div>
        </motion.div>

        {/* Screenshot with floating animation */}
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <BrowserFrame>
              <DashboardMockup />
            </BrowserFrame>
          </motion.div>
        </motion.div>
      </div>
    </div>
  </section>
);
