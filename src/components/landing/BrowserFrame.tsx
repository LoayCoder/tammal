import type { ReactNode } from "react";

interface BrowserFrameProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

export const BrowserFrame = ({ children, className = "", title = "tammal.app" }: BrowserFrameProps) => (
  <div className={`rounded-2xl overflow-hidden shadow-xl border border-gray-200/80 ${className}`}>
    {/* Title bar */}
    <div className="h-10 bg-gray-100 flex items-center gap-2 ps-4 pe-4 border-b border-gray-200/60">
      <div className="flex gap-1.5">
        <span className="w-3 h-3 rounded-full bg-gray-300" />
        <span className="w-3 h-3 rounded-full bg-gray-300" />
        <span className="w-3 h-3 rounded-full bg-gray-300" />
      </div>
      <div className="flex-1 text-center">
        <span className="text-[11px] text-gray-400 font-medium font-body">{title}</span>
      </div>
      <div className="w-[52px]" />
    </div>
    {/* Content */}
    <div className="bg-gray-50">{children}</div>
  </div>
);
