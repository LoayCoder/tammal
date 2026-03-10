
-- Add fulfillment instructions columns to redemption_options
ALTER TABLE public.redemption_options 
  ADD COLUMN IF NOT EXISTS fulfillment_instructions text,
  ADD COLUMN IF NOT EXISTS fulfillment_instructions_ar text;

-- Update redeem_points function to auto-fulfill
CREATE OR REPLACE FUNCTION public.redeem_points(p_user_id uuid, p_tenant_id uuid, p_option_id uuid, p_points_cost integer)
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

  -- Create redemption request - auto-fulfilled, no approval needed
  INSERT INTO redemption_requests (option_id, points_spent, user_id, tenant_id, status, fulfilled_at)
  VALUES (p_option_id, p_points_cost, p_user_id, p_tenant_id, 'fulfilled', now())
  RETURNING id INTO v_request_id;

  -- Debit points
  INSERT INTO points_transactions (user_id, tenant_id, amount, source_type, source_id, status, description)
  VALUES (p_user_id, p_tenant_id, -p_points_cost, 'redemption', v_request_id, 'redeemed', 'Redeemed points for reward');

  RETURN v_request_id;
END;
$function$;
