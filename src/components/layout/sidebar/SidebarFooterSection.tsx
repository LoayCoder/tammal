import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { SidebarFooter } from '@/components/ui/sidebar';
import { UserProfileSection } from './UserProfileSection';
import type { TFunction } from 'i18next';

interface SidebarFooterSectionProps {
  isCollapsed: boolean;
  isRTL: boolean;
  toggleSidebar: () => void;
  t: TFunction;
}

export function SidebarFooterSection({
  isCollapsed,
  isRTL,
  toggleSidebar,
  t,
}: SidebarFooterSectionProps) {
  const ToggleIcon = isCollapsed
    ? (isRTL ? ChevronsLeft : ChevronsRight)
    : (isRTL ? ChevronsRight : ChevronsLeft);

  return (
    <SidebarFooter className="border-t border-border/50 p-3">
      {isCollapsed && (
        <div className="flex justify-center">
          <button
            onClick={toggleSidebar}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/50 hover:text-sidebar-foreground"
            aria-label={t('accessibility.toggleSidebar')}
          >
            <ToggleIcon className="h-4 w-4" />
          </button>
        </div>
      )}
      <UserProfileSection isCollapsed={isCollapsed} />
    </SidebarFooter>
  );
}