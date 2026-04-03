import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Heart, LifeBuoy, User, Menu } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';

const navItems = [
  { key: 'dashboard', icon: LayoutDashboard, path: '/' },
  { key: 'wellness', icon: Heart, path: '/employee/wellness' },
  { key: 'support', icon: LifeBuoy, path: '/support' },
  { key: 'profile', icon: User, path: '/settings/profile' },
];

export function MobileBottomNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { setOpenMobile } = useSidebar();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-background/80 backdrop-blur-xl border-t border-border" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center justify-around h-12">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-1 min-w-[44px] min-h-[44px] transition-all duration-200 ${
                active ? 'text-foreground scale-110' : 'text-muted-foreground hover:text-foreground/70'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {active && <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary))]" />}
            </button>
          );
        })}
        <button
          onClick={() => setOpenMobile(true)}
          className="flex flex-col items-center justify-center gap-1 min-w-[44px] min-h-[44px] text-muted-foreground hover:text-foreground/70 transition-all duration-200"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </nav>
  );
}
