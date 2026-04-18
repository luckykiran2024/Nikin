-- Migration: Production hardening
-- Fills the remaining gaps from the architecture review:
--   * Ratings (two-sided trust)
--   * Disputes (structured, typed, with triggers)
--   * Delivery attempts + return flow
--   * Fraud signals + sender/traveler trust counters
--   * Payment intent (commitment before pickup, captured after delivery)
--   * Legal acceptance audit log
-- Idempotent: safe to re-run.

-- =========================================================
-- 1) RATINGS  (two-sided, one rating per shipment per rater)
-- =========================================================
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
  rater_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ratee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rater_role VARCHAR(20) NOT NULL,          -- 'sender' | 'traveler'
  stars INT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (shipment_id, rater_id)
);

CREATE INDEX IF NOT EXISTS idx_ratings_ratee ON ratings(ratee_id);
CREATE INDEX IF NOT EXISTS idx_ratings_shipment ON ratings(shipment_id);

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ratings_service_role" ON ratings;
CREATE POLICY "ratings_service_role" ON ratings
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "ratings_select_public" ON ratings;
CREATE POLICY "ratings_select_public" ON ratings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "ratings_insert_participant" ON ratings;
CREATE POLICY "ratings_insert_participant" ON ratings
  FOR INSERT WITH CHECK (
    auth.uid()::text = rater_id::text
    AND EXISTS (
      SELECT 1 FROM shipments s
      WHERE s.id = ratings.shipment_id
        AND s.status IN ('delivered','completed')
        AND (
          auth.uid()::text = s.sender_id::text
          OR auth.uid()::text = s.assigned_traveler_id::text
        )
    )
  );

-- Keep users.rating denormalized for fast display
CREATE OR REPLACE FUNCTION recompute_user_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_avg NUMERIC;
BEGIN
  SELECT COALESCE(AVG(stars), 0) INTO v_avg
    FROM ratings WHERE ratee_id = NEW.ratee_id;
  UPDATE users SET rating = ROUND(v_avg::numeric, 2) WHERE id = NEW.ratee_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recompute_user_rating ON ratings;
CREATE TRIGGER trg_recompute_user_rating
  AFTER INSERT OR UPDATE ON ratings
  FOR EACH ROW EXECUTE FUNCTION recompute_user_rating();

-- =========================================================
-- 2) DISPUTES  (structured, typed)
-- =========================================================
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
  raised_by UUID REFERENCES users(id) ON DELETE SET NULL,
  against_user UUID REFERENCES users(id) ON DELETE SET NULL,
  category VARCHAR(40) NOT NULL,            -- not_delivered | wrong_item | damaged | payment_issue | other
  trigger_stage VARCHAR(30) NOT NULL,        -- post_pickup | post_delivery
  description TEXT NOT NULL,
  evidence_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  status VARCHAR(20) DEFAULT 'open',         -- open | under_review | resolved | rejected
  resolution TEXT,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_disputes_shipment ON disputes(shipment_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);

ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "disputes_service_role" ON disputes;
CREATE POLICY "disputes_service_role" ON disputes
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "disputes_select_parties_or_admin" ON disputes;
CREATE POLICY "disputes_select_parties_or_admin" ON disputes
  FOR SELECT USING (
    auth.uid()::text = raised_by::text
    OR auth.uid()::text = against_user::text
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id::text = auth.uid()::text AND 'admin' = ANY(u.roles)
    )
  );

DROP POLICY IF EXISTS "disputes_insert_participant" ON disputes;
CREATE POLICY "disputes_insert_participant" ON disputes
  FOR INSERT WITH CHECK (
    auth.uid()::text = raised_by::text
    AND EXISTS (
      SELECT 1 FROM shipments s
      WHERE s.id = disputes.shipment_id
        AND (auth.uid()::text = s.sender_id::text OR auth.uid()::text = s.assigned_traveler_id::text)
        AND s.status IN ('picked_up','in_transit','out_for_delivery','delivered','completed')
    )
  );

DROP TRIGGER IF EXISTS trg_disputes_updated_at ON disputes;
CREATE TRIGGER trg_disputes_updated_at
  BEFORE UPDATE ON disputes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================================
-- 3) DELIVERY ATTEMPTS + RETURN FLOW
-- =========================================================
CREATE TABLE IF NOT EXISTS delivery_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
  traveler_id UUID REFERENCES users(id) ON DELETE SET NULL,
  attempt_no INT NOT NULL DEFAULT 1,
  outcome VARCHAR(30) NOT NULL,              -- success | receiver_unavailable | wrong_address | refused | rescheduled
  note TEXT,
  next_action VARCHAR(30),                    -- reschedule | return_to_sender | cancel
  rescheduled_for TIMESTAMP WITH TIME ZONE,
  evidence_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_attempts_shipment ON delivery_attempts(shipment_id);

ALTER TABLE delivery_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attempts_service_role" ON delivery_attempts;
CREATE POLICY "attempts_service_role" ON delivery_attempts
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "attempts_select_participants" ON delivery_attempts;
CREATE POLICY "attempts_select_participants" ON delivery_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM shipments s
      WHERE s.id = delivery_attempts.shipment_id
        AND (auth.uid()::text = s.sender_id::text OR auth.uid()::text = s.assigned_traveler_id::text)
    )
  );

DROP POLICY IF EXISTS "attempts_insert_traveler" ON delivery_attempts;
CREATE POLICY "attempts_insert_traveler" ON delivery_attempts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM shipments s
      WHERE s.id = delivery_attempts.shipment_id
        AND auth.uid()::text = s.assigned_traveler_id::text
    )
  );

-- Extend shipments with return flow + delivery window enforcement
ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS delivery_attempts_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS return_requested BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS return_requested_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS return_fee NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pickup_window_start TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS pickup_window_end TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS delivery_window_start TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS delivery_window_end TIMESTAMP WITH TIME ZONE;

-- Keep shipments.delivery_attempts_count in sync
CREATE OR REPLACE FUNCTION sync_delivery_attempts_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE shipments
     SET delivery_attempts_count = delivery_attempts_count + 1,
         last_attempt_at = NOW(),
         status = CASE
           WHEN NEW.outcome = 'success' THEN 'delivered'
           WHEN NEW.next_action = 'return_to_sender' THEN 'in_transit'
           ELSE status
         END,
         return_requested = CASE WHEN NEW.next_action = 'return_to_sender' THEN true ELSE return_requested END,
         return_requested_at = CASE WHEN NEW.next_action = 'return_to_sender' THEN NOW() ELSE return_requested_at END,
         updated_at = NOW()
   WHERE id = NEW.shipment_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_delivery_attempts ON delivery_attempts;
CREATE TRIGGER trg_sync_delivery_attempts
  AFTER INSERT ON delivery_attempts
  FOR EACH ROW EXECUTE FUNCTION sync_delivery_attempts_count();

-- =========================================================
-- 4) FRAUD SIGNALS + TRUST COUNTERS
-- =========================================================
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS cancellations_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS disputes_raised_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS disputes_against_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trust_score INT DEFAULT 100,
  ADD COLUMN IF NOT EXISTS trust_flags TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS fraud_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  shipment_id UUID REFERENCES shipments(id) ON DELETE SET NULL,
  signal VARCHAR(60) NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'low',
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fraud_user ON fraud_events(user_id, created_at DESC);

ALTER TABLE fraud_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fraud_service_role" ON fraud_events;
CREATE POLICY "fraud_service_role" ON fraud_events
  FOR ALL USING (auth.role() = 'service_role');

-- Counter triggers
CREATE OR REPLACE FUNCTION bump_cancellation_counter()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'cancelled' AND (OLD.status IS DISTINCT FROM 'cancelled') AND NEW.cancelled_by IS NOT NULL THEN
    UPDATE users
       SET cancellations_count = cancellations_count + 1,
           trust_score = GREATEST(trust_score - 2, 0)
     WHERE id = NEW.cancelled_by;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bump_cancellation ON shipments;
CREATE TRIGGER trg_bump_cancellation
  AFTER UPDATE ON shipments
  FOR EACH ROW EXECUTE FUNCTION bump_cancellation_counter();

CREATE OR REPLACE FUNCTION bump_dispute_counters()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users SET disputes_raised_count = disputes_raised_count + 1 WHERE id = NEW.raised_by;
  IF NEW.against_user IS NOT NULL THEN
    UPDATE users
       SET disputes_against_count = disputes_against_count + 1,
           trust_score = GREATEST(trust_score - 5, 0)
     WHERE id = NEW.against_user;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bump_disputes ON disputes;
CREATE TRIGGER trg_bump_disputes
  AFTER INSERT ON disputes
  FOR EACH ROW EXECUTE FUNCTION bump_dispute_counters();

-- =========================================================
-- 5) PAYMENT INTENT (commitment before pickup)
-- =========================================================
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS intent_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS intent_status VARCHAR(30),          -- created | authorized | captured | failed | refunded
  ADD COLUMN IF NOT EXISTS intent_amount NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS intent_created_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS captured_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(10,2);

CREATE INDEX IF NOT EXISTS idx_payments_intent ON payments(intent_id);

-- =========================================================
-- 6) LEGAL ACCEPTANCE AUDIT
-- =========================================================
CREATE TABLE IF NOT EXISTS legal_acceptances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  document VARCHAR(40) NOT NULL,             -- terms | privacy | prohibited | liability | refund
  version VARCHAR(20) NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip VARCHAR(64),
  user_agent TEXT,
  UNIQUE (user_id, document, version)
);

CREATE INDEX IF NOT EXISTS idx_legal_user ON legal_acceptances(user_id);

ALTER TABLE legal_acceptances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "legal_service_role" ON legal_acceptances;
CREATE POLICY "legal_service_role" ON legal_acceptances
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "legal_select_self" ON legal_acceptances;
CREATE POLICY "legal_select_self" ON legal_acceptances
  FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "legal_insert_self" ON legal_acceptances;
CREATE POLICY "legal_insert_self" ON legal_acceptances
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- =========================================================
-- 7) DISPUTE WINDOW HELPER (reject if too late / too early)
-- =========================================================
CREATE OR REPLACE FUNCTION enforce_dispute_window()
RETURNS TRIGGER AS $$
DECLARE
  v_status TEXT;
  v_delivered_at TIMESTAMPTZ;
BEGIN
  SELECT status, delivery_confirmed_at INTO v_status, v_delivered_at
    FROM shipments WHERE id = NEW.shipment_id;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Shipment not found for dispute';
  END IF;

  -- Post-pickup disputes only after parcel is in transit / delivered
  IF NEW.trigger_stage = 'post_pickup'
     AND v_status NOT IN ('picked_up','in_transit','out_for_delivery','delivered','completed') THEN
    RAISE EXCEPTION 'Dispute can only be raised after pickup';
  END IF;

  -- Post-delivery disputes must be within 72 hours
  IF NEW.trigger_stage = 'post_delivery' THEN
    IF v_delivered_at IS NULL THEN
      RAISE EXCEPTION 'Shipment not yet delivered';
    END IF;
    IF NOW() - v_delivered_at > INTERVAL '72 hours' THEN
      RAISE EXCEPTION 'Dispute window (72h) has expired';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_dispute_window ON disputes;
CREATE TRIGGER trg_enforce_dispute_window
  BEFORE INSERT ON disputes
  FOR EACH ROW EXECUTE FUNCTION enforce_dispute_window();

COMMENT ON TABLE ratings IS 'Two-sided rating, 1 per shipment per rater.';
COMMENT ON TABLE disputes IS 'Structured disputes with type + trigger window enforcement.';
COMMENT ON TABLE delivery_attempts IS 'Delivery attempt log, drives return/reschedule flow.';
COMMENT ON TABLE fraud_events IS 'Silent fraud signals aggregated per user.';
COMMENT ON TABLE legal_acceptances IS 'Audit log of accepted legal documents per user/version.';
