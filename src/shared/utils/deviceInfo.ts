/**
 * Device information utilities extracted from auth hooks.
 * Provides user-agent parsing and IP geolocation lookup.
 */

export interface DeviceInfo {
  device_type: string;
  browser: string;
  os: string;
}

export interface LocationInfo {
  ip: string | null;
  country: string | null;
  city: string | null;
}

/** Parse user agent string to extract device type, browser, and OS */
export function parseUserAgent(ua: string): DeviceInfo {
  let device_type = 'Desktop';
  if (/mobile/i.test(ua)) device_type = 'Mobile';
  if (/tablet|ipad/i.test(ua)) device_type = 'Tablet';

  let browser = 'Unknown';
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';

  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return { device_type, browser, os };
}

/**
 * Fetch IP and location info using a single resilient endpoint with timeout.
 * Non-fatal: failure must never block login flow.
 */
export async function getLocationInfo(): Promise<LocationInfo | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const resp = await fetch('https://ip-api.com/json/?fields=query,country,city', {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!resp.ok) return null;
    const data = await resp.json();
    return {
      ip: data.query || null,
      country: data.country || null,
      city: data.city || null,
    };
  } catch {
    return null;
  }
}
