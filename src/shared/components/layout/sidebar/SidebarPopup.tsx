import React, { useRef, useEffect, useState } from 'react';
import { NavLink } from '@/shared/components/NavLink';
import { cn } from '@/shared/utils/utils';

interface PopupItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SidebarPopupProps {
  label: string;
  items: PopupItem[];
  anchorRect: DOMRect | null;
  onClose: () => void;
  onNavClick?: () => void;
}

export const SidebarPopup = React.memo(function SidebarPopup({
  label,
  items,
  anchorRect,
  onClose,
  onNavClick,
}: SidebarPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; start: number }>({ top: 0, start: 0 });
  const isRTL = document.documentElement.dir === 'rtl';

  useEffect(() => {
    if (!anchorRect) return;
    const top = anchorRect.top;
    const start = isRTL ? window.innerWidth - anchorRect.left + 8 : anchorRect.right + 8;
    setPosition({ top, start });
  }, [anchorRect, isRTL]);

  if (!anchorRect) return null;

  return (
    <div
      ref={popupRef}
      className="fixed z-50 w-[180px] rounded-xl border border-border/40 bg-card p-3 shadow-xl"
      style={{
        top: position.top,
        ...(isRTL ? { right: position.start } : { left: position.start }),
      }}
      onMouseEnter={(e) => e.stopPropagation()}
      onMouseLeave={onClose}
    >
      <p className="mb-2 text-xs font-semibold text-muted-foreground">{label}</p>
      <div className="flex flex-col gap-0.5">
        {items.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent/10"
            activeClassName="bg-[hsl(var(--sidebar-active-bg))] text-sidebar-primary font-medium"
            onClick={onNavClick}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.title}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
});

