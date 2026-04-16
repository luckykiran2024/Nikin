-- Compliance + live tracking + offline payment migration
-- Idempotent: safe to re-run

-- USERS: extra profile fields used by the app
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS active_role VARCHAR(20) DEFAULT 'sender',
  ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
  ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS earnings DECIMAL(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS aadhaar_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS aadhaar_number VARCHAR(20);

-- SHIPMENTS: compliance, tracking, offline payment fields
ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS parcel_details JSONB,
  ADD COLUMN IF NOT EXISTS pickup_coords JSONB,
  ADD COLUMN IF NOT EXISTS destination_coords JSONB,
  ADD COLUMN IF NOT EXISTS assigned_traveler_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS assigned_traveler_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS pickup_images TEXT[],
  ADD COLUMN IF NOT EXISTS delivery_images TEXT[],
  ADD COLUMN IF NOT EXISTS delivery_confirmed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) DEFAULT 'cod_pending',
  ADD COLUMN IF NOT EXISTS payment_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS special_instructions TEXT,
  ADD COLUMN IF NOT EXISTS current_location JSONB,
  ADD COLUMN IF NOT EXISTS tracking_history JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS chat_id UUID,
  ADD COLUMN IF NOT EXISTS traveler_parcel_image TEXT,
  ADD COLUMN IF NOT EXISTS pickup_details_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS declaration_accepted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS declaration_accepted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS declaration_ip VARCHAR(64);

-- Enforce declaration presence on new parcel requests (MVP compliance requirement)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'shipments_declaration_required'
  ) THEN
    ALTER TABLE shipments
      ADD CONSTRAINT shipments_declaration_required
      CHECK (declaration_accepted = true OR status = 'created');
  END IF;
END$$;

-- Live tracking timeline (per-point GPS history, queryable by either party)
CREATE TABLE IF NOT EXISTS tracking_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
  traveler_id UUID REFERENCES users(id) ON DELETE SET NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  shipment_status VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tracking_updates_shipment ON tracking_updates(shipment_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_updates_traveler ON tracking_updates(traveler_id);

ALTER TABLE tracking_updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tracking_service_role" ON tracking_updates;
CREATE POLICY "tracking_service_role" ON tracking_updates
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "tracking_select_participants" ON tracking_updates;
CREATE POLICY "tracking_select_participants" ON tracking_updates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM shipments s
      WHERE s.id = tracking_updates.shipment_id
        AND (
          auth.uid()::text = s.sender_id::text
          OR auth.uid()::text = s.assigned_traveler_id::text
        )
    )
  );

DROP POLICY IF EXISTS "tracking_insert_assigned_traveler" ON tracking_updates;
CREATE POLICY "tracking_insert_assigned_traveler" ON tracking_updates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM shipments s
      WHERE s.id = tracking_updates.shipment_id
        AND auth.uid()::text = s.assigned_traveler_id::text
    )
  );

-- PAYMENTS: mark that MVP uses offline (cash/UPI on delivery) payments
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS is_offline BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS collected_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS collected_by_traveler BOOLEAN DEFAULT false;

-- Drop escrow-era default platform fee requirement so offline payments can be logged
ALTER TABLE payments ALTER COLUMN platform_fee DROP NOT NULL;
ALTER TABLE payments ALTER COLUMN traveler_payout DROP NOT NULL;
ALTER TABLE payments ALTER COLUMN platform_fee SET DEFAULT 0;
ALTER TABLE payments ALTER COLUMN traveler_payout SET DEFAULT 0;

-- Helper: append a tracking update and sync shipment.current_location in one call
CREATE OR REPLACE FUNCTION record_tracking_update(
  p_shipment_id UUID,
  p_traveler_id UUID,
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_accuracy DOUBLE PRECISION DEFAULT NULL,
  p_speed DOUBLE PRECISION DEFAULT NULL,
  p_heading DOUBLE PRECISION DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
  v_status VARCHAR(50);
BEGIN
  SELECT status INTO v_status FROM shipments WHERE id = p_shipment_id;

  INSERT INTO tracking_updates (shipment_id, traveler_id, latitude, longitude, accuracy, speed, heading, shipment_status)
  VALUES (p_shipment_id, p_traveler_id, p_lat, p_lng, p_accuracy, p_speed, p_heading, v_status)
  RETURNING id INTO v_id;

  UPDATE shipments
  SET current_location = jsonb_build_object('latitude', p_lat, 'longitude', p_lng),
      updated_at = NOW()
  WHERE id = p_shipment_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recommended shipment status set (documentation-only comment)
COMMENT ON COLUMN shipments.status IS
  'created | quoted | assigned | confirmed | picked_up | in_transit | out_for_delivery | delivered | completed | cancelled';
