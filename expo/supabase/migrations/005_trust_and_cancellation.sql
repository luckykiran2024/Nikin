-- Migration: Trust limits, job acceptance, and cancellation rules
-- Adds columns to support:
--  * Traveler "Accept Job" flow with deadline
--  * Structured shipment cancellation (who/when/reason)
--  * New shipment statuses: pending_acceptance, cancelled

-- 1) New columns on shipments
ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS job_accept_deadline TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS job_accepted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cancellation_reason VARCHAR(50),
  ADD COLUMN IF NOT EXISTS cancellation_note TEXT;

CREATE INDEX IF NOT EXISTS idx_shipments_status_deadline
  ON shipments(status, job_accept_deadline)
  WHERE status = 'pending_acceptance';

CREATE INDEX IF NOT EXISTS idx_shipments_cancelled_by ON shipments(cancelled_by);

-- 2) Helper view for sender "active" shipments (used by trust limits)
CREATE OR REPLACE VIEW sender_active_shipments AS
SELECT sender_id, COUNT(*)::INT AS active_count
FROM shipments
WHERE status IN (
  'created','quoted','pending_acceptance','assigned','payment_pending',
  'confirmed','picked_up','in_transit','out_for_delivery'
)
GROUP BY sender_id;

-- 3) Quote status allows 'declined' (in addition to existing values)
--    Existing column is VARCHAR, so no schema change required, but we document valid values here.
COMMENT ON COLUMN quotes.status IS 'pending | accepted | rejected | expired | declined';

-- 4) Shipment status documentation
COMMENT ON COLUMN shipments.status IS
  'created | quoted | pending_acceptance | assigned | payment_pending | confirmed | '
  'picked_up | in_transit | out_for_delivery | delivered | completed | cancelled';

-- 5) Utility function: auto-expire pending_acceptance shipments whose deadline has passed.
--    Call this periodically (e.g. pg_cron) or invoke from the backend on read.
CREATE OR REPLACE FUNCTION expire_pending_acceptance()
RETURNS INTEGER AS $$
DECLARE
  affected INTEGER;
BEGIN
  WITH expired AS (
    UPDATE shipments
       SET status = 'quoted',
           assigned_traveler_id = NULL,
           assigned_traveler_name = NULL,
           assigned_traveler_phone = NULL,
           final_price = NULL,
           chat_id = NULL,
           job_accept_deadline = NULL,
           updated_at = NOW()
     WHERE status = 'pending_acceptance'
       AND job_accept_deadline IS NOT NULL
       AND job_accept_deadline < NOW()
     RETURNING id
  )
  SELECT COUNT(*) INTO affected FROM expired;

  -- Also mark the corresponding accepted quotes as expired
  UPDATE quotes
     SET status = 'expired'
   WHERE status = 'accepted'
     AND shipment_id IN (
       SELECT id FROM shipments
        WHERE status = 'quoted'
          AND job_accept_deadline IS NULL
     );

  RETURN COALESCE(affected, 0);
END;
$$ LANGUAGE plpgsql;

-- 6) Trust-limit enforcement function (advisory; backend also enforces)
CREATE OR REPLACE FUNCTION enforce_sender_limits()
RETURNS TRIGGER AS $$
DECLARE
  active_count INT;
  max_value NUMERIC := 20000;
  max_active INT := 5;
  parcel_value NUMERIC;
BEGIN
  parcel_value := COALESCE((NEW.parcel_details->>'estimatedValue')::NUMERIC, 0);
  IF parcel_value > max_value THEN
    RAISE EXCEPTION 'Parcel value % exceeds pilot limit of %', parcel_value, max_value;
  END IF;

  SELECT COUNT(*) INTO active_count
    FROM shipments
   WHERE sender_id = NEW.sender_id
     AND status IN (
       'created','quoted','pending_acceptance','assigned','payment_pending',
       'confirmed','picked_up','in_transit','out_for_delivery'
     );

  IF active_count >= max_active THEN
    RAISE EXCEPTION 'Sender % already has % active shipments (limit %)',
      NEW.sender_id, active_count, max_active;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_sender_limits ON shipments;
CREATE TRIGGER trg_enforce_sender_limits
  BEFORE INSERT ON shipments
  FOR EACH ROW EXECUTE FUNCTION enforce_sender_limits();
