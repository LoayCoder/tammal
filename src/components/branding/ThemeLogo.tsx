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

  // Select logo based on current theme
  const selectedLogo = theme === 'dark' ?
  logoDarkUrl || logoUrl :
  logoLightUrl || logoUrl;

  if (!selectedLogo) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <img
      src={selectedLogo}
      alt={alt}
      className={`object-contain border-0 ${className}`}
    />);



}