import { useAuthContext } from '@/providers/AuthProvider';

/**
 * Central authentication hook.
 * Consumes the single AuthProvider context — no extra subscriptions.
 */
export function useAuth() {
  return useAuthContext();
}
