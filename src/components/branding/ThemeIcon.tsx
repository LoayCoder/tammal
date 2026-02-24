import { useTheme } from '@/hooks/branding/useTheme';

interface ThemeIconProps {
  iconLightUrl?: string | null;
  iconDarkUrl?: string | null;
  className?: string;
  alt?: string;
  fallback?: React.ReactNode;
}

export function ThemeIcon({
  iconLightUrl,
  iconDarkUrl,
  className = '',
  alt = 'Icon',
  fallback,
}: ThemeIconProps) {
  const { theme } = useTheme();

  // Select icon based on current theme
  const selectedIcon = theme === 'dark' ? iconDarkUrl : iconLightUrl;

  if (!selectedIcon) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <img
      src={selectedIcon}
      alt={alt}
      className={className}
    />
  );
}
