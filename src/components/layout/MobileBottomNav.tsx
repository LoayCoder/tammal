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
    <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden glass-header" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] rounded-xl transition-colors ${
                active
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium leading-tight">{t(item.translationKey)}</span>
            </button>
          );
        })}
        <button
          onClick={() => setOpenMobile(true)}
          className="flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] rounded-xl text-muted-foreground transition-colors"
        >
          <Menu className="h-5 w-5" />
          <span className="text-[10px] font-medium leading-tight">{t('common.more')}</span>
        </button>
      </div>
    </nav>
  );
}
