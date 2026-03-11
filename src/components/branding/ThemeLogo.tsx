import { useTheme } from '@/hooks/branding/useTheme';

interface ThemeLogoProps {
  logoUrl?: string | null;
  logoLightUrl?: string | null;
  logoDarkUrl?: string | null;
  className?: string;
  alt?: string;
  fallback?: React.ReactNode;
}

export function ThemeLogo({
  logoUrl,
  logoLightUrl,
  logoDarkUrl,
  className = '',
  alt = 'Logo',
  fallback
}: ThemeLogoProps) {
  const { theme } = useTheme();

  // Priority: theme-specific override → general logo_url → fallback
  // logoUrl is the "full logo" (primary asset).
  // logoLightUrl / logoDarkUrl are optional theme overrides.
  const selectedLogo = theme === 'dark'
    ? (logoDarkUrl || logoUrl)
    : (logoLightUrl || logoUrl);

  if (!selectedLogo) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <img
      src={selectedLogo}
      alt={alt}
      className={`object-contain border-0 ${className}`}
    />
  );
}
