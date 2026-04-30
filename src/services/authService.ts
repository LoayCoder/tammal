import { supabase } from '@/integrations/supabase/client';

export interface ChangePasswordInput {
  password: string;
}

export interface ChangeEmailInput {
  email: string;
}

export async function changePassword(input: ChangePasswordInput) {
  const { error } = await supabase.auth.updateUser({
    password: input.password,
  });
  if (error) throw error;
}

export async function changeEmail(input: ChangeEmailInput) {
  const { error } = await supabase.auth.updateUser({
    email: input.email,
  });
  if (error) throw error;
}