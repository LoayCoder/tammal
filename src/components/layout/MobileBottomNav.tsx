import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutGrid, ListChecks, Send, Heart, Menu } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';

const navItems = [
  { key: 'dashboard', icon: LayoutGrid, path: '/dashboard' },
  { key: 'workload', icon: ListChecks, path: '/my-workload' },
  { key: 'peer-support', icon: Send, path: '/crisis-support' },
  { key: 'wellness-hub', icon: Heart, path: '/wellness' },
];

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setOpenMobile } = useSidebar();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-background/80 backdrop-blur-xl border-t border-border" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              className="flex items-center justify-center min-w-[44px] min-h-[44px] transition-all duration-200"
            >
              <div className={`flex items-center justify-center rounded-xl transition-all duration-200 ${
                active
                  ? 'bg-primary/12 px-4 py-1.5 text-primary'
                  : 'px-2 py-1.5 text-muted-foreground/70 hover:text-muted-foreground'
              }`}>
                <item.icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
            </button>
          );
        })}
        <button
          onClick={() => setOpenMobile(true)}
          className="flex items-center justify-center min-w-[44px] min-h-[44px] transition-all duration-200"
        >
          <div className="flex items-center justify-center px-2 py-1.5 text-muted-foreground/70 hover:text-muted-foreground transition-all duration-200">
            <Menu className="h-5 w-5" strokeWidth={1.75} />
          </div>
        </button>
      </div>
    </nav>
  );
}
