import { useMutation } from '@tanstack/react-query';
import { changeEmail, changePassword } from '@/services/authService';

export function useChangePassword() {
  return useMutation({
    mutationFn: ({ password }: { password: string }) => changePassword({ password }),
  });
}

export function useChangeEmail() {
  return useMutation({
    mutationFn: ({ email }: { email: string }) => changeEmail({ email }),
  });
}