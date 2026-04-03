import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Heart, LifeBuoy, User, Menu } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';

const navItems = [
  { key: 'dashboard', icon: LayoutDashboard, path: '/', translationKey: 'nav.dashboard' },
  { key: 'wellness', icon: Heart, path: '/wellness', translationKey: 'nav.wellness' },
  { key: 'support', icon: LifeBuoy, path: '/support', translationKey: 'nav.support' },
  { key: 'profile', icon: User, path: '/profile', translationKey: 'profile.title' },
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
    <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-background border-t border-border" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center justify-around h-12">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-1 min-w-[44px] min-h-[44px] transition-colors ${
                active ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {active && <span className="w-1 h-1 rounded-full bg-primary" />}
            </button>
          );
        })}
        <button
          onClick={() => setOpenMobile(true)}
          className="flex flex-col items-center justify-center gap-1 min-w-[44px] min-h-[44px] text-muted-foreground transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </nav>
  );
}
