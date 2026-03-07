
-- 1. Restrict votes SELECT: users can only see their own votes, admins see all
DROP POLICY IF EXISTS "Tenant read" ON public.votes;
CREATE POLICY "Users read own votes"
  ON public.votes FOR SELECT TO authenticated
  USING (voter_id = auth.uid());

CREATE POLICY "Admins read all votes"
  ON public.votes FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'super_admin') OR
    has_role(auth.uid(), 'tenant_admin')
  );

-- 2. Remove hard DELETE policy on nominations (soft-delete only)
DROP POLICY IF EXISTS "Admins can delete" ON public.nominations;

-- 3. Restrict points self-insert: remove permissive user insert policy
DROP POLICY IF EXISTS "Users can insert own points" ON public.points_transactions;

-- 4. Create a refund function for rejected redemptions
CREATE OR REPLACE FUNCTION public.refund_rejected_redemption()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'rejected' AND OLD.status IS DISTINCT FROM 'rejected' THEN
    INSERT INTO points_transactions (user_id, tenant_id, amount, source_type, source_id, status, description)
    VALUES (
      NEW.user_id,
      NEW.tenant_id,
      NEW.points_spent,
      'system_adjustment',
      NEW.id,
      'credited',
      'Automatic refund for rejected redemption request'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_refund_rejected_redemption
  AFTER UPDATE ON public.redemption_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.refund_rejected_redemption();
