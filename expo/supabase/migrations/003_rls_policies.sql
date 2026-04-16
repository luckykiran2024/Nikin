-- Extended Row Level Security policies for all tables
-- Idempotent: safe to re-run

-- USERS
DROP POLICY IF EXISTS "users_insert_self" ON users;
CREATE POLICY "users_insert_self" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

DROP POLICY IF EXISTS "users_select_self_or_admin" ON users;
CREATE POLICY "users_select_self_or_admin" ON users
  FOR SELECT USING (
    auth.uid()::text = id::text
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id::text = auth.uid()::text AND 'admin' = ANY(u.roles)
    )
  );

-- SHIPMENTS
DROP POLICY IF EXISTS "shipments_browse_open" ON shipments;
CREATE POLICY "shipments_browse_open" ON shipments
  FOR SELECT USING (
    status IN ('created','quoted')
    OR auth.uid()::text = sender_id::text
    OR auth.uid()::text = assigned_traveler_id::text
  );

DROP POLICY IF EXISTS "shipments_update_owner_or_assigned" ON shipments;
CREATE POLICY "shipments_update_owner_or_assigned" ON shipments
  FOR UPDATE USING (
    auth.uid()::text = sender_id::text
    OR auth.uid()::text = assigned_traveler_id::text
  );

-- QUOTES
DROP POLICY IF EXISTS "quotes_insert_traveler" ON quotes;
CREATE POLICY "quotes_insert_traveler" ON quotes
  FOR INSERT WITH CHECK (auth.uid()::text = traveler_id::text);

DROP POLICY IF EXISTS "quotes_select_participants" ON quotes;
CREATE POLICY "quotes_select_participants" ON quotes
  FOR SELECT USING (
    auth.uid()::text = traveler_id::text
    OR EXISTS (
      SELECT 1 FROM shipments s
      WHERE s.id = quotes.shipment_id
      AND s.sender_id::text = auth.uid()::text
    )
  );

-- TRAVEL ROUTES
DROP POLICY IF EXISTS "routes_public_read" ON travel_routes;
CREATE POLICY "routes_public_read" ON travel_routes FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "routes_insert_self" ON travel_routes;
CREATE POLICY "routes_insert_self" ON travel_routes
  FOR INSERT WITH CHECK (auth.uid()::text = traveler_id::text);

DROP POLICY IF EXISTS "routes_modify_self" ON travel_routes;
CREATE POLICY "routes_modify_self" ON travel_routes
  FOR UPDATE USING (auth.uid()::text = traveler_id::text);

-- PAYMENTS (read-only for parties)
DROP POLICY IF EXISTS "payments_select_parties" ON payments;
CREATE POLICY "payments_select_parties" ON payments
  FOR SELECT USING (
    auth.uid()::text = sender_id::text
    OR auth.uid()::text = traveler_id::text
  );

-- KYC REQUESTS
DROP POLICY IF EXISTS "kyc_insert_self" ON kyc_requests;
CREATE POLICY "kyc_insert_self" ON kyc_requests
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "kyc_select_self_or_admin" ON kyc_requests;
CREATE POLICY "kyc_select_self_or_admin" ON kyc_requests
  FOR SELECT USING (
    auth.uid()::text = user_id::text
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id::text = auth.uid()::text AND 'admin' = ANY(u.roles)
    )
  );

-- CHAT
DROP POLICY IF EXISTS "chat_conv_participants" ON chat_conversations;
CREATE POLICY "chat_conv_participants" ON chat_conversations
  FOR SELECT USING (auth.uid() = ANY(participants));

DROP POLICY IF EXISTS "chat_msg_participants_select" ON chat_messages;
CREATE POLICY "chat_msg_participants_select" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_conversations c
      WHERE c.id = chat_messages.conversation_id
      AND auth.uid() = ANY(c.participants)
    )
  );

DROP POLICY IF EXISTS "chat_msg_insert_self" ON chat_messages;
CREATE POLICY "chat_msg_insert_self" ON chat_messages
  FOR INSERT WITH CHECK (auth.uid()::text = sender_id::text);

-- NOTIFICATIONS
DROP POLICY IF EXISTS "notif_self" ON notifications;
CREATE POLICY "notif_self" ON notifications
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- TICKETS
DROP POLICY IF EXISTS "tickets_self_or_admin" ON escalated_tickets;
CREATE POLICY "tickets_self_or_admin" ON escalated_tickets
  FOR SELECT USING (
    auth.uid()::text = user_id::text
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id::text = auth.uid()::text AND 'admin' = ANY(u.roles)
    )
  );

DROP POLICY IF EXISTS "tickets_insert_self" ON escalated_tickets;
CREATE POLICY "tickets_insert_self" ON escalated_tickets
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Indexes for role-based admin lookups
CREATE INDEX IF NOT EXISTS idx_users_roles ON users USING GIN(roles);
CREATE INDEX IF NOT EXISTS idx_shipments_pickup_city ON shipments(pickup_city);
CREATE INDEX IF NOT EXISTS idx_shipments_destination_city ON shipments(destination_city);
