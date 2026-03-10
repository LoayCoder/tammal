
ALTER TABLE public.award_cycles
ADD COLUMN shortlist_count integer NOT NULL DEFAULT 3,
ADD COLUMN require_acknowledgment boolean NOT NULL DEFAULT true;

ALTER TABLE public.nominee_rankings
ADD COLUMN acknowledged_at timestamptz DEFAULT NULL;
