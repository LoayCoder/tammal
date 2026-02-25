
-- ==========================================
-- RECOGNITION & AWARDS SYSTEM - PHASE 1
-- ==========================================

-- 1. award_cycles
CREATE TABLE public.award_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    name TEXT NOT NULL,
    name_ar TEXT,
    created_by UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'configuring',
    nomination_start TIMESTAMPTZ NOT NULL,
    nomination_end TIMESTAMPTZ NOT NULL,
    peer_endorsement_end TIMESTAMPTZ NOT NULL,
    voting_start TIMESTAMPTZ NOT NULL,
    voting_end TIMESTAMPTZ NOT NULL,
    audit_review_days INTEGER NOT NULL DEFAULT 3,
    announcement_date TIMESTAMPTZ NOT NULL,
    fairness_config JSONB NOT NULL DEFAULT '{"biasDetection":{"cliqueThreshold":0.4,"demographicParityTarget":0.8,"visibilityBiasCorrection":true},"auditSettings":{"publishRawScores":true,"allowAppeals":true}}'::jsonb,
    stats JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- 2. award_themes
CREATE TABLE public.award_themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    cycle_id UUID NOT NULL REFERENCES public.award_cycles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    name_ar TEXT,
    description TEXT,
    description_ar TEXT,
    image_url TEXT,
    nomination_rules JSONB NOT NULL DEFAULT '{"allowedNominators":["manager","peer"],"managerQuota":{"maxPerTeamPercent":30,"minTeamSizeForQuota":5},"peerRequirements":{"minEndorsements":2,"maxEndorsementsPerPeer":3,"crossDepartmentRequired":true},"evidenceRequired":{"minWordCount":200,"maxWordCount":1000,"attachmentsAllowed":3}}'::jsonb,
    voting_rules JSONB NOT NULL DEFAULT '{"allowedVoters":["all_employees"],"scoringMethod":"multi_criteria","minJustificationLength":50}'::jsonb,
    rewards JSONB NOT NULL DEFAULT '{"winnerPoints":5000,"runnerUpPoints":2000,"finalistPoints":1000,"voterParticipationPoints":100,"nominatorPoints":200}'::jsonb,
    data_integration JSONB DEFAULT '{"enabled":false}'::jsonb,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- 3. judging_criteria
CREATE TABLE public.judging_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    theme_id UUID NOT NULL REFERENCES public.award_themes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    name_ar TEXT,
    description TEXT,
    description_ar TEXT,
    weight NUMERIC(3,2) NOT NULL DEFAULT 0.25,
    scoring_guide JSONB NOT NULL DEFAULT '{"1":"Poor","2":"Below Average","3":"Average","4":"Good","5":"Excellent"}'::jsonb,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- 4. nominations
CREATE TABLE public.nominations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    cycle_id UUID NOT NULL REFERENCES public.award_cycles(id),
    theme_id UUID NOT NULL REFERENCES public.award_themes(id),
    nominee_id UUID NOT NULL,
    nominee_department_id UUID REFERENCES public.departments(id),
    nominee_tenure_months INTEGER,
    nominator_id UUID NOT NULL,
    nominator_role TEXT NOT NULL DEFAULT 'peer',
    nominator_department_id UUID REFERENCES public.departments(id),
    headline TEXT NOT NULL,
    justification TEXT NOT NULL,
    specific_examples JSONB DEFAULT '[]'::jsonb,
    impact_metrics JSONB DEFAULT '[]'::jsonb,
    cross_department_evidence JSONB DEFAULT '{}'::jsonb,
    manager_assessment JSONB,
    ai_analysis JSONB DEFAULT '{}'::jsonb,
    endorsement_status TEXT NOT NULL DEFAULT 'pending',
    status TEXT NOT NULL DEFAULT 'draft',
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- 5. nomination_attachments
CREATE TABLE public.nomination_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    nomination_id UUID NOT NULL REFERENCES public.nominations(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    storage_path TEXT NOT NULL,
    thumbnail_path TEXT,
    uploaded_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- 6. peer_endorsements
CREATE TABLE public.peer_endorsements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    nomination_id UUID NOT NULL REFERENCES public.nominations(id) ON DELETE CASCADE,
    endorser_id UUID NOT NULL,
    endorser_department_id UUID REFERENCES public.departments(id),
    relationship TEXT NOT NULL DEFAULT 'direct_colleague',
    confirmation_statement TEXT NOT NULL,
    additional_context TEXT,
    is_valid BOOLEAN DEFAULT true,
    validation_reason TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(nomination_id, endorser_id)
);

-- 7. votes
CREATE TABLE public.votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    nomination_id UUID NOT NULL REFERENCES public.nominations(id),
    theme_id UUID NOT NULL REFERENCES public.award_themes(id),
    cycle_id UUID NOT NULL REFERENCES public.award_cycles(id),
    voter_id UUID NOT NULL,
    voter_department_id UUID REFERENCES public.departments(id),
    voter_role TEXT,
    relationship_to_nominee JSONB NOT NULL DEFAULT '{}'::jsonb,
    criteria_scores JSONB NOT NULL DEFAULT '[]'::jsonb,
    calculated_weighted_score NUMERIC(4,2),
    justifications JSONB DEFAULT '[]'::jsonb,
    confidence_level TEXT DEFAULT 'medium',
    applied_weight NUMERIC(3,2) DEFAULT 1.00,
    voted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    time_spent_seconds INTEGER,
    ip_hash TEXT,
    deleted_at TIMESTAMPTZ,
    UNIQUE(nomination_id, voter_id)
);

-- 8. theme_results
CREATE TABLE public.theme_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    theme_id UUID NOT NULL REFERENCES public.award_themes(id),
    cycle_id UUID NOT NULL REFERENCES public.award_cycles(id),
    first_place_nomination_id UUID REFERENCES public.nominations(id),
    second_place_nomination_id UUID REFERENCES public.nominations(id),
    third_place_nomination_id UUID REFERENCES public.nominations(id),
    fairness_report JSONB NOT NULL DEFAULT '{}'::jsonb,
    appeal_status TEXT NOT NULL DEFAULT 'closed',
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- 9. nominee_rankings
CREATE TABLE public.nominee_rankings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    theme_results_id UUID NOT NULL REFERENCES public.theme_results(id) ON DELETE CASCADE,
    nomination_id UUID NOT NULL REFERENCES public.nominations(id),
    rank INTEGER NOT NULL,
    raw_average_score NUMERIC(4,2),
    weighted_average_score NUMERIC(4,2),
    criterion_breakdown JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_votes INTEGER DEFAULT 0,
    vote_distribution JSONB DEFAULT '{}'::jsonb,
    confidence_interval JSONB DEFAULT '[]'::jsonb,
    data_metrics_validation JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- 10. appeals
CREATE TABLE public.appeals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    theme_results_id UUID NOT NULL REFERENCES public.theme_results(id),
    appellant_id UUID NOT NULL,
    grounds TEXT NOT NULL,
    description TEXT NOT NULL,
    new_evidence_attachment_ids JSONB DEFAULT '[]'::jsonb,
    committee_review JSONB,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

-- 11. points_transactions
CREATE TABLE public.points_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    user_id UUID NOT NULL,
    source_type TEXT NOT NULL,
    source_id TEXT,
    amount INTEGER NOT NULL,
    description TEXT,
    awarded_by UUID,
    awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'credited',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- 12. redemption_options
CREATE TABLE public.redemption_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    name TEXT NOT NULL,
    name_ar TEXT,
    description TEXT,
    description_ar TEXT,
    points_cost INTEGER NOT NULL,
    category TEXT NOT NULL DEFAULT 'experience',
    max_per_year INTEGER,
    min_tenure_months INTEGER DEFAULT 0,
    fulfillment_config JSONB NOT NULL DEFAULT '{"type":"manual"}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- 13. redemption_requests
CREATE TABLE public.redemption_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    user_id UUID NOT NULL,
    option_id UUID NOT NULL REFERENCES public.redemption_options(id),
    points_spent INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    fulfilled_at TIMESTAMPTZ,
    hr_notes TEXT,
    tracking_number TEXT,
    rejection_reason TEXT,
    deleted_at TIMESTAMPTZ
);

-- ==========================================
-- VALIDATION TRIGGERS
-- ==========================================

CREATE OR REPLACE FUNCTION public.validate_award_cycle_status()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status NOT IN ('configuring','nominating','voting','calculating','announced','archived') THEN
    RAISE EXCEPTION 'Invalid award_cycle status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_validate_award_cycle_status BEFORE INSERT OR UPDATE ON public.award_cycles FOR EACH ROW EXECUTE FUNCTION public.validate_award_cycle_status();

CREATE OR REPLACE FUNCTION public.validate_nomination_status()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status NOT IN ('draft','submitted','endorsed','shortlisted','rejected') THEN
    RAISE EXCEPTION 'Invalid nomination status: %', NEW.status;
  END IF;
  IF NEW.endorsement_status NOT IN ('pending','sufficient','insufficient') THEN
    RAISE EXCEPTION 'Invalid endorsement_status: %', NEW.endorsement_status;
  END IF;
  IF NEW.nominator_role NOT IN ('manager','peer','self') THEN
    RAISE EXCEPTION 'Invalid nominator_role: %', NEW.nominator_role;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_validate_nomination_status BEFORE INSERT OR UPDATE ON public.nominations FOR EACH ROW EXECUTE FUNCTION public.validate_nomination_status();

CREATE OR REPLACE FUNCTION public.validate_endorsement_relationship()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.relationship NOT IN ('direct_colleague','cross_functional','client','reports_to') THEN
    RAISE EXCEPTION 'Invalid endorsement relationship: %', NEW.relationship;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_validate_endorsement_relationship BEFORE INSERT OR UPDATE ON public.peer_endorsements FOR EACH ROW EXECUTE FUNCTION public.validate_endorsement_relationship();

CREATE OR REPLACE FUNCTION public.validate_vote_confidence()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.confidence_level NOT IN ('high','medium','low') THEN
    RAISE EXCEPTION 'Invalid confidence_level: %', NEW.confidence_level;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_validate_vote_confidence BEFORE INSERT OR UPDATE ON public.votes FOR EACH ROW EXECUTE FUNCTION public.validate_vote_confidence();

CREATE OR REPLACE FUNCTION public.validate_points_transaction()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.source_type NOT IN ('award_win','award_runner_up','award_finalist','voter_participation','nominator_bonus','peer_recognition','manager_discretionary','system_adjustment','redemption','expiry') THEN
    RAISE EXCEPTION 'Invalid points source_type: %', NEW.source_type;
  END IF;
  IF NEW.status NOT IN ('pending','credited','redeemed','expired','revoked') THEN
    RAISE EXCEPTION 'Invalid points status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_validate_points_transaction BEFORE INSERT OR UPDATE ON public.points_transactions FOR EACH ROW EXECUTE FUNCTION public.validate_points_transaction();

CREATE OR REPLACE FUNCTION public.validate_appeal_grounds()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.grounds NOT IN ('procedural_error','new_evidence','bias_allegation','scoring_discrepancy') THEN
    RAISE EXCEPTION 'Invalid appeal grounds: %', NEW.grounds;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_validate_appeal_grounds BEFORE INSERT OR UPDATE ON public.appeals FOR EACH ROW EXECUTE FUNCTION public.validate_appeal_grounds();

CREATE OR REPLACE FUNCTION public.validate_redemption_category()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.category NOT IN ('time_off','cash_equivalent','experience','charity','merchandise') THEN
    RAISE EXCEPTION 'Invalid redemption category: %', NEW.category;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_validate_redemption_category BEFORE INSERT OR UPDATE ON public.redemption_options FOR EACH ROW EXECUTE FUNCTION public.validate_redemption_category();

CREATE OR REPLACE FUNCTION public.validate_redemption_request_status()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status NOT IN ('pending','approved','fulfilled','rejected') THEN
    RAISE EXCEPTION 'Invalid redemption request status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_validate_redemption_request_status BEFORE INSERT OR UPDATE ON public.redemption_requests FOR EACH ROW EXECUTE FUNCTION public.validate_redemption_request_status();

CREATE OR REPLACE FUNCTION public.validate_theme_result_appeal_status()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.appeal_status NOT IN ('open','under_review','resolved','closed') THEN
    RAISE EXCEPTION 'Invalid theme_results appeal_status: %', NEW.appeal_status;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_validate_theme_result_appeal_status BEFORE INSERT OR UPDATE ON public.theme_results FOR EACH ROW EXECUTE FUNCTION public.validate_theme_result_appeal_status();

-- ==========================================
-- updated_at TRIGGERS
-- ==========================================
CREATE TRIGGER update_award_cycles_updated_at BEFORE UPDATE ON public.award_cycles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_nominations_updated_at BEFORE UPDATE ON public.nominations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- INDEXES
-- ==========================================
CREATE INDEX idx_award_cycles_tenant ON public.award_cycles(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_award_themes_cycle ON public.award_themes(cycle_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_judging_criteria_theme ON public.judging_criteria(theme_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_nominations_cycle_theme ON public.nominations(cycle_id, theme_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_nominations_nominee ON public.nominations(nominee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_nominations_nominator ON public.nominations(nominator_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_nominations_status ON public.nominations(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_votes_nomination ON public.votes(nomination_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_votes_voter ON public.votes(voter_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_peer_endorsements_nomination ON public.peer_endorsements(nomination_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_points_user_status ON public.points_transactions(user_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_points_tenant ON public.points_transactions(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_redemption_requests_user ON public.redemption_requests(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_theme_results_cycle ON public.theme_results(cycle_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_nominee_rankings_results ON public.nominee_rankings(theme_results_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_appeals_results ON public.appeals(theme_results_id) WHERE deleted_at IS NULL;

-- ==========================================
-- RLS POLICIES
-- ==========================================

-- award_cycles
ALTER TABLE public.award_cycles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON public.award_cycles FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins can insert" ON public.award_cycles FOR INSERT TO authenticated WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(), 'tenant_admin') OR has_role(auth.uid(), 'super_admin')));
CREATE POLICY "Admins can update" ON public.award_cycles FOR UPDATE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(), 'tenant_admin') OR has_role(auth.uid(), 'super_admin')));
CREATE POLICY "Admins can delete" ON public.award_cycles FOR DELETE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(), 'tenant_admin') OR has_role(auth.uid(), 'super_admin')));

-- award_themes
ALTER TABLE public.award_themes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON public.award_themes FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins can insert" ON public.award_themes FOR INSERT TO authenticated WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(), 'tenant_admin') OR has_role(auth.uid(), 'super_admin')));
CREATE POLICY "Admins can update" ON public.award_themes FOR UPDATE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(), 'tenant_admin') OR has_role(auth.uid(), 'super_admin')));
CREATE POLICY "Admins can delete" ON public.award_themes FOR DELETE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(), 'tenant_admin') OR has_role(auth.uid(), 'super_admin')));

-- judging_criteria
ALTER TABLE public.judging_criteria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON public.judging_criteria FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins can insert" ON public.judging_criteria FOR INSERT TO authenticated WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(), 'tenant_admin') OR has_role(auth.uid(), 'super_admin')));
CREATE POLICY "Admins can update" ON public.judging_criteria FOR UPDATE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(), 'tenant_admin') OR has_role(auth.uid(), 'super_admin')));
CREATE POLICY "Admins can delete" ON public.judging_criteria FOR DELETE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(), 'tenant_admin') OR has_role(auth.uid(), 'super_admin')));

-- nominations
ALTER TABLE public.nominations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant read" ON public.nominations FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users can insert own" ON public.nominations FOR INSERT TO authenticated WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND nominator_id = auth.uid());
CREATE POLICY "Users can update own" ON public.nominations FOR UPDATE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND (nominator_id = auth.uid() OR has_role(auth.uid(), 'tenant_admin') OR has_role(auth.uid(), 'super_admin')));
CREATE POLICY "Admins can delete" ON public.nominations FOR DELETE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(), 'tenant_admin') OR has_role(auth.uid(), 'super_admin')));

-- nomination_attachments
ALTER TABLE public.nomination_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant read" ON public.nomination_attachments FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users can insert own" ON public.nomination_attachments FOR INSERT TO authenticated WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND uploaded_by = auth.uid());
CREATE POLICY "Users can delete own" ON public.nomination_attachments FOR DELETE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND (uploaded_by = auth.uid() OR has_role(auth.uid(), 'tenant_admin') OR has_role(auth.uid(), 'super_admin')));

-- peer_endorsements
ALTER TABLE public.peer_endorsements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant read" ON public.peer_endorsements FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users can insert own" ON public.peer_endorsements FOR INSERT TO authenticated WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND endorser_id = auth.uid());
CREATE POLICY "Users can update own" ON public.peer_endorsements FOR UPDATE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND (endorser_id = auth.uid() OR has_role(auth.uid(), 'tenant_admin') OR has_role(auth.uid(), 'super_admin')));

-- votes
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant read" ON public.votes FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users can insert own" ON public.votes FOR INSERT TO authenticated WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND voter_id = auth.uid());
CREATE POLICY "Users can update own" ON public.votes FOR UPDATE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND voter_id = auth.uid());

-- theme_results
ALTER TABLE public.theme_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant read" ON public.theme_results FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins can insert" ON public.theme_results FOR INSERT TO authenticated WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(), 'tenant_admin') OR has_role(auth.uid(), 'super_admin')));
CREATE POLICY "Admins can update" ON public.theme_results FOR UPDATE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(), 'tenant_admin') OR has_role(auth.uid(), 'super_admin')));

-- nominee_rankings
ALTER TABLE public.nominee_rankings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant read" ON public.nominee_rankings FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins can insert" ON public.nominee_rankings FOR INSERT TO authenticated WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(), 'tenant_admin') OR has_role(auth.uid(), 'super_admin')));
CREATE POLICY "Admins can update" ON public.nominee_rankings FOR UPDATE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(), 'tenant_admin') OR has_role(auth.uid(), 'super_admin')));

-- appeals
ALTER TABLE public.appeals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant read" ON public.appeals FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users can insert own" ON public.appeals FOR INSERT TO authenticated WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND appellant_id = auth.uid());
CREATE POLICY "Admins can update" ON public.appeals FOR UPDATE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(), 'tenant_admin') OR has_role(auth.uid(), 'super_admin')));

-- points_transactions
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own" ON public.points_transactions FOR SELECT TO authenticated USING (user_id = auth.uid() OR has_role(auth.uid(), 'tenant_admin') OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins can insert" ON public.points_transactions FOR INSERT TO authenticated WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(), 'tenant_admin') OR has_role(auth.uid(), 'super_admin')));
CREATE POLICY "Admins can update" ON public.points_transactions FOR UPDATE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(), 'tenant_admin') OR has_role(auth.uid(), 'super_admin')));

-- redemption_options
ALTER TABLE public.redemption_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant read" ON public.redemption_options FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins can insert" ON public.redemption_options FOR INSERT TO authenticated WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(), 'tenant_admin') OR has_role(auth.uid(), 'super_admin')));
CREATE POLICY "Admins can update" ON public.redemption_options FOR UPDATE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(), 'tenant_admin') OR has_role(auth.uid(), 'super_admin')));
CREATE POLICY "Admins can delete" ON public.redemption_options FOR DELETE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(), 'tenant_admin') OR has_role(auth.uid(), 'super_admin')));

-- redemption_requests
ALTER TABLE public.redemption_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own" ON public.redemption_requests FOR SELECT TO authenticated USING (user_id = auth.uid() OR has_role(auth.uid(), 'tenant_admin') OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users can insert own" ON public.redemption_requests FOR INSERT TO authenticated WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND user_id = auth.uid());
CREATE POLICY "Admins can update" ON public.redemption_requests FOR UPDATE TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()) AND (has_role(auth.uid(), 'tenant_admin') OR has_role(auth.uid(), 'super_admin')));

-- ==========================================
-- STORAGE BUCKET
-- ==========================================
INSERT INTO storage.buckets (id, name, public) VALUES ('recognition-attachments', 'recognition-attachments', false);

CREATE POLICY "Tenant users can upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'recognition-attachments' AND (storage.foldername(name))[1] = get_user_tenant_id(auth.uid())::text);
CREATE POLICY "Tenant users can view" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'recognition-attachments' AND (storage.foldername(name))[1] = get_user_tenant_id(auth.uid())::text);
CREATE POLICY "Admins can delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'recognition-attachments' AND ((storage.foldername(name))[1] = get_user_tenant_id(auth.uid())::text) AND (has_role(auth.uid(), 'tenant_admin') OR has_role(auth.uid(), 'super_admin')));
