
-- STEP 1: Allow regular users to insert their own points
CREATE POLICY "Users can insert own points"
ON public.points_transactions FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND tenant_id = public.get_user_tenant_id(auth.uid())
);

-- STEP 2: Update validation trigger to accept new source types
CREATE OR REPLACE FUNCTION public.validate_points_transaction()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.source_type NOT IN (
    'award_win','award_runner_up','award_finalist',
    'voter_participation','nominator_bonus',
    'peer_recognition','manager_discretionary',
    'system_adjustment','redemption','expiry',
    'daily_checkin','survey_completion'
  ) THEN
    RAISE EXCEPTION 'Invalid points source_type: %', NEW.source_type;
  END IF;
  IF NEW.status NOT IN ('pending','credited','redeemed','expired','revoked') THEN
    RAISE EXCEPTION 'Invalid points status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$function$;

-- STEPS 4 & 6: Atomic redemption function with balance check + max_per_year
CREATE OR REPLACE FUNCTION public.redeem_points(
  p_user_id uuid,
  p_tenant_id uuid,
  p_option_id uuid,
  p_points_cost int
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_balance int;
  v_max_per_year int;
  v_year_count int;
  v_request_id uuid;
BEGIN
  -- Calculate current balance
  SELECT COALESCE(SUM(amount), 0) INTO v_balance
  FROM points_transactions
  WHERE user_id = p_user_id
    AND tenant_id = p_tenant_id
    AND deleted_at IS NULL
    AND status IN ('credited', 'redeemed');

  IF v_balance < p_points_cost THEN
    RAISE EXCEPTION 'Insufficient points balance. Have: %, Need: %', v_balance, p_points_cost;
  END IF;

  -- Check max_per_year
  SELECT max_per_year INTO v_max_per_year
  FROM redemption_options
  WHERE id = p_option_id AND deleted_at IS NULL;

  IF v_max_per_year IS NOT NULL THEN
    SELECT COUNT(*) INTO v_year_count
    FROM redemption_requests
    WHERE user_id = p_user_id
      AND option_id = p_option_id
      AND deleted_at IS NULL
      AND status NOT IN ('rejected')
      AND EXTRACT(YEAR FROM requested_at) = EXTRACT(YEAR FROM now());

    IF v_year_count >= v_max_per_year THEN
      RAISE EXCEPTION 'Maximum redemptions per year reached for this reward (% of %)', v_year_count, v_max_per_year;
    END IF;
  END IF;

  -- Create redemption request
  INSERT INTO redemption_requests (option_id, points_spent, user_id, tenant_id)
  VALUES (p_option_id, p_points_cost, p_user_id, p_tenant_id)
  RETURNING id INTO v_request_id;

  -- Debit points
  INSERT INTO points_transactions (user_id, tenant_id, amount, source_type, source_id, status, description)
  VALUES (p_user_id, p_tenant_id, -p_points_cost, 'redemption', v_request_id, 'redeemed', 'Redeemed points for reward');

  RETURN v_request_id;
END;
$function$;
